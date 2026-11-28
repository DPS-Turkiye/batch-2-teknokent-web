import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import "server-only";

import {
  UserAccountStatus,
  UserRole,
  type AppSession,
  type BackendUser,
  type SessionData,
} from "@/interfaces/session";
import type { Workspace } from "@/interfaces/workspace";
import { fetchUser } from "@/lib/api/accounts";
import { hasPermission, samePermissions } from "@/lib/permissions";
import {
  currentSessionUser,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/public-paths";
import { appEdition } from "@/lib/server/edition";
import { SessionRequiredError } from "@/lib/server/session-error";
import { toSession as toSessionModel } from "@/lib/session-model";
import { workspacesOf } from "@/lib/workspaces";

function sessionOptions(persist = false): SessionOptions {
  const password = process.env.SESSION_PASSWORD;
  if (!password || password.length < 32) {
    throw new Error("SESSION_PASSWORD must contain at least 32 characters.");
  }

  return {
    cookieName: SESSION_COOKIE,
    password,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: persist ? SESSION_MAX_AGE_SECONDS : undefined,
    },
  };
}

/** The account's session under this deployment's edition (the model is shared with the browser). */
function toSession(user: BackendUser): AppSession | null {
  return toSessionModel(user, appEdition());
}

/**
 * The cookie's user, read under this deployment's edition rather than the one stamped at sign-in: a cookie from
 * before editions, or one minted while APP_EDITION said otherwise, must not open the wrong workspaces.
 */
function sessionUserOf(session: SessionData): AppSession | null {
  const user = currentSessionUser(session);
  return user ? { ...user, edition: appEdition() } : null;
}

export async function getSessionStore() {
  return getIronSession<SessionData>(await cookies(), sessionOptions());
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
    const response = await fetchUser(
      user.userId,
      user.userId,
      ACCOUNT_RECHECK_TIMEOUT_MS,
    );
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
  const user = sessionUserOf(session);
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
      session.destroy();
    }
  } catch {
    // Server components may read cookies but not write them; the verdict still
    // holds for this render and the next route handler writes it.
  }
  return matches ? user : null;
}

/**
 * After joining, creating or leaving a startup, so the next re-check does not end
 * the session for a changed organization, and after a badge changes what the user
 * may do. Not a new sign-in: issuedAt stays, so the 12-hour limit and an admin's
 * sign-in revoke still count from the original. `keepWorkspace` stays open when
 * the account can still use it.
 */
export async function refreshSessionUser(
  user: BackendUser,
  keepWorkspace?: Workspace,
) {
  const next = toSession(user);
  if (!next) return null;
  if (keepWorkspace && workspacesOf(next).includes(keepWorkspace)) {
    next.activeWorkspace = keepWorkspace;
  }
  const session = await getSessionStore();
  session.updateConfig(sessionOptions(session.persist === true));
  session.user = next;
  await session.save();
  return next;
}

export async function destroySession() {
  const session = await getSessionStore();
  session.destroy();
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
