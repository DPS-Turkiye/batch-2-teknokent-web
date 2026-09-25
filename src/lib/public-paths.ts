import { isMobilePath, MOBILE_LOGIN } from "@/lib/mobile";

export const SESSION_COOKIE = "teknokent_session";

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
