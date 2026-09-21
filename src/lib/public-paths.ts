export const SESSION_COOKIE = "teknokent_session";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/invite",
  "/application-status",
]);

/** Pages a visitor may open without being signed in. */
export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname) || pathname.startsWith("/invite");
}

/** Where a signed-out visitor is sent, remembering where they were headed. */
export function loginPathFor(pathname: string) {
  return `/login?${new URLSearchParams({ next: pathname })}`;
}
