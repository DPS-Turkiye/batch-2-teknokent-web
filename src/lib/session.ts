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
import { fetchUser } from "@/lib/api/accounts";
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

export function toSession(user: BackendUser): AppSession | null {
  if (user.role === UserRole.Mentee) {
    // Someone who signed up without a startup has none until they join or create one on /startup.
    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      jobTitle: user.jobTitle ?? "Mentee",
      role: UserRole.Mentee,
      organizationId: user.organizationId ?? undefined,
      organizationName: user.organizationName ?? undefined,
      individualMentee: user.individualMentee,
    };
  }
  if (user.role === UserRole.Mentor) {
    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      jobTitle: user.jobTitle ?? "Mentor",
      role: UserRole.Mentor,
    };
  }
  if (user.role === UserRole.Admin) {
    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      jobTitle: user.jobTitle ?? "Admin",
      role: UserRole.Admin,
    };
  }
  if (user.role === UserRole.Coordinator) {
    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      jobTitle: user.jobTitle ?? "Koordinatör",
      role: UserRole.Coordinator,
    };
  }
  return null;
}

export async function getSessionStore(persist = false) {
  return getIronSession<SessionData>(await cookies(), sessionOptions(persist));
}

/** How long a signed-in account is trusted before the backend is asked again. */
export const ACCOUNT_RECHECK_MS = 10 * 60 * 1000;

// A hung backend would otherwise hold every request due a re-check for 15 s.
const ACCOUNT_RECHECK_TIMEOUT_MS = 3000;

/**
 * Whether the account still matches its session: approved, same role and same
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
  if (session?.role !== UserRole.Mentor) {
    throw new SessionRequiredError();
  }
  return session.userId;
}
