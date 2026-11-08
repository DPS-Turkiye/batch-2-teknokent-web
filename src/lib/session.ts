import "server-only";

import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

import {
  UserAccountStatus,
  UserRole,
  type BackendUser,
  type AppSession,
  type SessionData,
} from "@/interfaces/session";
import type { Workspace } from "@/interfaces/workspace";
import { fetchUser } from "@/lib/api/accounts";
import {
  hasPermission,
  permissionsOf,
  samePermissions,
} from "@/lib/permissions";
import { isWorkspace, workspacesOf } from "@/lib/workspaces";
import {
  currentSessionUser,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/public-paths";
import { SessionRequiredError } from "@/lib/server/session-error";

function sessionOptions(persist = false): SessionOptions {
  const password = process.env.SESSION_PASSWORD;
  if (!password || password.length < 32) {
    throw new Error("SESSION_PASSWORD must contain at least 32 characters.");
  }

  return {
    cookieName: "teknokent_session",
    password,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: persist ? SESSION_MAX_AGE_SECONDS : undefined,
    },
  };
}

const DEFAULT_JOB_TITLE: Partial<Record<UserRole, string>> = {
  [UserRole.Mentee]: "Mentee",
  [UserRole.Mentor]: "Mentor",
  [UserRole.Admin]: "Admin",
  [UserRole.Coordinator]: "Koordinatör",
  [UserRole.Academician]: "Akademisyen",
};

export function toSession(user: BackendUser): AppSession | null {
  const jobTitle = DEFAULT_JOB_TITLE[user.role];
  if (!jobTitle) return null;
  const session: AppSession = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    jobTitle: user.jobTitle ?? jobTitle,
    role: user.role,
    permissions: permissionsOf(user),
  };
  if (user.institutionKinds?.length) {
    session.institutionKinds = user.institutionKinds;
  }
  // Whoever is mentored carries their team, a research assistant (primary role ACADEMICIAN) included. Someone who
  // signed up without a startup has none until they join or create one on /startup.
  if (session.permissions?.includes(UserRole.Mentee)) {
    session.organizationId = user.organizationId ?? undefined;
    session.organizationName = user.organizationName ?? undefined;
    session.individualMentee = user.individualMentee;
    if (user.personalOrganization) session.personalOrganization = true;
  }
  return session;
}

/** The workspace last switched to, kept past sign-out so the next sign-in opens it again. */
export const LAST_WORKSPACE_COOKIE = "menton_last_workspace";
const LAST_WORKSPACE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export async function lastWorkspace(): Promise<Workspace | undefined> {
  const saved = (await cookies()).get(LAST_WORKSPACE_COOKIE)?.value;
  return isWorkspace(saved) ? saved : undefined;
}

/**
 * Switches the signed-in session to `workspace` if the account can open it. Only the cookie changes: every backend
 * call still checks the account's own permissions, so a switch never widens what the account may do.
 */
export async function switchSessionWorkspace(
  workspace: Workspace,
): Promise<AppSession | null> {
  const session = await getSessionStore();
  const user = currentSessionUser(session);
  if (!user || !workspacesOf(user).includes(workspace)) return null;
  session.updateConfig(sessionOptions(session.persist === true));
  session.user = { ...user, activeWorkspace: workspace };
  await session.save();
  (await cookies()).set(LAST_WORKSPACE_COOKIE, workspace, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: LAST_WORKSPACE_MAX_AGE_SECONDS,
  });
  return session.user;
}

export async function getSessionStore(persist = false) {
  return getIronSession<SessionData>(await cookies(), sessionOptions(persist));
}

/** How long a signed-in account is trusted before the backend is asked again. */
export const ACCOUNT_RECHECK_MS = 10 * 60 * 1000;

// A hung backend would otherwise hold every request due a re-check for 15 s.
const ACCOUNT_RECHECK_TIMEOUT_MS = 3000;

/**
 * Whether the account still matches its session: approved, same role, permissions and
 * organization, and no admin ended its sign-ins after this one began. null when
 * the backend could not answer.
 */
async function accountStillMatches(user: AppSession, issuedAt: number) {
  try {
    const response = await fetchUser(user.userId, ACCOUNT_RECHECK_TIMEOUT_MS);
    if (response.status === 404) return false;
    if (response.status === 401 || response.status === 403) {
      // The service credential was refused: the check is off for everyone.
      console.error("Account re-check refused by the backend", {
        status: response.status,
      });
    }
    if (response.status !== 200) return null;
    const account = response.data;
    const current = toSession(account);
    const revokedAt = Date.parse(account.signInsRevokedAt ?? "");
    return (
      (account.status ?? UserAccountStatus.Approved) ===
        UserAccountStatus.Approved &&
      current?.role === user.role &&
      samePermissions(current, user) &&
      current.organizationId === user.organizationId &&
      !(revokedAt >= issuedAt)
    );
  } catch {
    return null;
  }
}

/**
 * The signed-in user, re-checked against the backend every ACCOUNT_RECHECK_MS so
 * a rejected or removed account, or a changed role or organization, stops acting
 * through an old cookie. Every proxy route reads the session through here.
 */
export async function getSessionUser() {
  const session = await getSessionStore();
  const user = currentSessionUser(session);
  if (!user) return null;

  const now = Date.now();
  const sinceCheck = now - (session.checkedAt ?? Number.NaN);
  if (sinceCheck >= 0 && sinceCheck < ACCOUNT_RECHECK_MS) return user;

  const matches = await accountStillMatches(user, session.issuedAt ?? 0);
  // A backend outage must not sign everyone out; the next call asks again.
  if (matches === null) return user;

  try {
    if (matches) {
      session.updateConfig(sessionOptions(session.persist === true));
      session.checkedAt = now;
      await session.save();
    } else {
      await session.destroy();
    }
  } catch {
    // Server components may read cookies but not write them; the verdict still
    // holds for this render and the next route handler writes it.
  }
  return matches ? user : null;
}

export async function saveSessionUser(user: AppSession, persist = false) {
  const session = await getSessionStore(persist);
  session.user = user;
  session.issuedAt = Date.now();
  session.checkedAt = session.issuedAt;
  session.persist = persist;
  await session.save();
}

/**
 * After joining, creating or leaving a startup, so the next re-check does not end
 * the session for a changed organization. Not a new sign-in: issuedAt stays, so
 * the 12-hour limit and an admin's sign-in revoke still count from the original.
 */
export async function refreshSessionUser(user: BackendUser) {
  const next = toSession(user);
  if (!next) return null;
  const session = await getSessionStore();
  session.updateConfig(sessionOptions(session.persist === true));
  session.user = next;
  await session.save();
  return next;
}

export async function destroySession() {
  const session = await getSessionStore();
  await session.destroy();
}

export async function getSessionIds() {
  const session = await getSessionUser();
  if (!session) {
    throw new SessionRequiredError();
  }
  return {
    userId: session.userId,
    organizationId: session.organizationId ?? "",
  };
}

export async function getSessionMentorId() {
  const session = await getSessionUser();
  if (!session || !hasPermission(session, UserRole.Mentor)) {
    throw new SessionRequiredError();
  }
  return session.userId;
}
