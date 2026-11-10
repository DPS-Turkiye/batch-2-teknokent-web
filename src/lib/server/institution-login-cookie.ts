import "server-only";

import { timingSafeEqual } from "node:crypto";

import type { NextRequest, NextResponse } from "next/server";

import type { InstitutionProvider } from "@/interfaces/institution-login";
import { safeNextPath, SESSION_COOKIE } from "@/lib/public-paths";

/**
 * Binds an institution login to the browser that started it. The backend's state proves the callback belongs
 * to a login it started, but not to this browser: without the cookie, a callback link from someone else's
 * login would sign the visitor into that person's account (login CSRF).
 */
export const INSTITUTION_LOGIN_COOKIE = "menton_institution_login";

// As long as the backend keeps the state.
const MAX_AGE_SECONDS = 10 * 60;

export type PendingInstitutionLogin = {
  provider: InstitutionProvider;
  state: string;
  next: string | null;
};

export function rememberInstitutionLogin(
  response: NextResponse,
  pending: PendingInstitutionLogin,
) {
  response.cookies.set(INSTITUTION_LOGIN_COOKIE, JSON.stringify(pending), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Lax: the browser comes back from the institution with a top-level GET.
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return response;
}

export function forgetInstitutionLogin(response: NextResponse) {
  response.cookies.set(INSTITUTION_LOGIN_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}

/** Drops the Menton session cookie, so the sign-in that follows starts from nobody. */
export function endSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}

function sameText(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** The login this browser started for {@code provider} with {@code state}; null when it started none. */
export function pendingInstitutionLogin(
  request: NextRequest,
  provider: InstitutionProvider,
  state: string,
): PendingInstitutionLogin | null {
  const raw = request.cookies.get(INSTITUTION_LOGIN_COOKIE)?.value;
  if (!raw) return null;
  try {
    const saved = JSON.parse(raw) as Partial<PendingInstitutionLogin>;
    if (
      saved.provider !== provider ||
      typeof saved.state !== "string" ||
      !sameText(saved.state, state)
    ) {
      return null;
    }
    return {
      provider,
      state: saved.state,
      next: safeNextPath(typeof saved.next === "string" ? saved.next : null),
    };
  } catch {
    return null;
  }
}
