import { isMobilePath, MOBILE_LOGIN } from "@/lib/mobile";
import { OTG_CALLBACK_PATH, OTG_START_PATH } from "@/lib/otg-login";

/** How long the API's "remember me" session cookie lasts; the browser's signed-in hint follows it. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/invite",
  "/application-status",
  "/unsubscribe",
  "/login/odtu/dev",
  OTG_START_PATH,
  OTG_CALLBACK_PATH,
  MOBILE_LOGIN,
]);

/**
 * Office hours are signed into by the LTI launch from Moodle and keep their own session, so the Menton
 * sign-in never stands in front of them; their pages check that session themselves.
 */
export function isOfficeHoursPath(pathname: string) {
  return (
    pathname.startsWith("/lti/") ||
    pathname === "/office-hours" ||
    pathname.startsWith("/office-hours/")
  );
}

/** Pages a visitor may open without being signed in. */
export function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/invite") ||
    isOfficeHoursPath(pathname)
  );
}

/**
 * A ?next= that is not an in-app path — an absolute URL, or //evil.example —
 * would turn a redirect into an open redirect. Browsers also read a backslash as
 * a slash and drop tabs and newlines, so /\evil.example and /<tab>/evil.example
 * are the same trick.
 */
export function safeNextPath(next: string | null) {
  return next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !/[\\\u0000-\u001f\u007f]/.test(next)
    ? next
    : null;
}

/** The page a session QR code opens: `/attend/<token>`. */
export const ATTEND_PATH = "/attend";

export function attendancePath(token: string) {
  return `${ATTEND_PATH}/${encodeURIComponent(token)}`;
}

export function isAttendancePath(pathname: string) {
  return pathname.startsWith(`${ATTEND_PATH}/`);
}

/** Where a signed-out visitor is sent, remembering where they were headed. */
export function loginPathFor(pathname: string) {
  const login = isMobilePath(pathname) ? MOBILE_LOGIN : "/login";
  return `${login}?${new URLSearchParams({ next: pathname })}`;
}
