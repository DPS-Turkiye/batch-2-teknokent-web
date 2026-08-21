import "server-only";

import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

import {
  SessionRole,
  type BackendUser,
  type DemoSession,
  type SessionData,
} from "@/interfaces/session";
import { fetchUser, fetchUsers } from "@/lib/api/accounts";

export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000003";
export const DEFAULT_ORGANIZATION_ID = "10000000-0000-0000-0000-000000000001";

function sessionOptions(): SessionOptions {
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
      maxAge: 60 * 60 * 12,
    },
  };
}

export function toSession(user: BackendUser): DemoSession | null {
  if (user.role !== "MENTEE" && user.role !== "MENTOR") return null;
  const role = user.role === "MENTOR" ? SessionRole.Mentor : SessionRole.Mentee;
  if (
    role === SessionRole.Mentee &&
    (!user.organizationId || !user.organizationName)
  ) {
    return null;
  }
  return {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    jobTitle:
      user.jobTitle ?? (role === SessionRole.Mentor ? "Mentor" : "Mentee"),
    organizationId: user.organizationId ?? undefined,
    organizationName: user.organizationName ?? undefined,
    role,
  };
}

export async function getSessionStore() {
  return getIronSession<SessionData>(await cookies(), sessionOptions());
}

export async function getSessionUser(options: { demoFallback?: boolean } = {}) {
  const session = await getSessionStore();
  if (session.user) return session.user;
  if (options.demoFallback === false) return null;

  const response = await fetchUser(DEFAULT_USER_ID);
  return response.status === 200 ? toSession(response.data) : null;
}

export async function findDemoSessionByEmail(email: string) {
  const response = await fetchUsers();
  if (response.status !== 200 || !Array.isArray(response.data)) return null;
  const normalizedEmail = email.trim().toLowerCase();
  const user = response.data.find(
    (candidate) => candidate.email.toLowerCase() === normalizedEmail,
  );
  return user ? toSession(user) : null;
}

export async function saveSessionUser(user: DemoSession) {
  const session = await getSessionStore();
  session.user = user;
  await session.save();
}

export async function destroySession() {
  const session = await getSessionStore();
  session.destroy();
}

export async function getSessionIds() {
  const session = await getSessionUser();
  return {
    userId: session?.userId ?? DEFAULT_USER_ID,
    organizationId: session?.organizationId ?? DEFAULT_ORGANIZATION_ID,
  };
}
