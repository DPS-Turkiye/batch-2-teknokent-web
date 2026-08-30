import "server-only";

import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

import {
  UserRole,
  type BackendUser,
  type AppSession,
  type SessionData,
} from "@/interfaces/session";
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
      maxAge: persist ? 60 * 60 * 12 : undefined,
    },
  };
}

export function toSession(user: BackendUser): AppSession | null {
  if (user.role === UserRole.Mentee) {
    if (!user.organizationId || !user.organizationName) return null;
    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      jobTitle: user.jobTitle ?? "Mentee",
      role: UserRole.Mentee,
      organizationId: user.organizationId,
      organizationName: user.organizationName,
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
      jobTitle: user.jobTitle ?? "Koordinatör",
      role: UserRole.Admin,
    };
  }
  return null;
}

export async function getSessionStore(persist = false) {
  return getIronSession<SessionData>(await cookies(), sessionOptions(persist));
}

export async function getSessionUser() {
  const session = await getSessionStore();
  return session.user ?? null;
}

export async function saveSessionUser(user: AppSession, persist = false) {
  const session = await getSessionStore(persist);
  session.user = user;
  await session.save();
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
