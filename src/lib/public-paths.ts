import type { AppSession, SessionData } from "@/interfaces/session";
import { isMobilePath, MOBILE_LOGIN } from "@/lib/mobile";

export const SESSION_COOKIE = "teknokent_session";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

/**
 * A session is only as old as its issuedAt says. The cookie's own expiry can't be
 * relied on: a sign-in without "remember me" is a browser-session cookie, which
 * iron-session seals with no expiry at all, and the "remember me" seal outlives
 * its 12-hour cookie by days. Sessions saved before issuedAt existed count as expired.
 */
export function currentSessionUser(
  data: SessionData,
  now = Date.now(),
): AppSession | null {
  if (!data.user || typeof data.issuedAt !== "number") return null;
  const age = now - data.issuedAt;
  // A minute of clock skew between servers; a later issuedAt would never expire.
  return age > -60_000 && age < SESSION_MAX_AGE_SECONDS * 1000
    ? data.user
    : null;
}

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/invite",
  "/application-status",
  MOBILE_LOGIN,
]);

/** Pages a visitor may open without being signed in. */
export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname) || pathname.startsWith("/invite");
}

/**
 * A ?next= that is not an in-app path — an absolute URL, or //evil.example —
 * would turn a redirect into an open redirect.
 */
export function safeNextPath(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

/** Where a signed-out visitor is sent, remembering where they were headed. */
export function loginPathFor(pathname: string) {
  const login = isMobilePath(pathname) ? MOBILE_LOGIN : "/login";
  return `${login}?${new URLSearchParams({ next: pathname })}`;
}
