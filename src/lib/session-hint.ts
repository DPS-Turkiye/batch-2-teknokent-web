import { UserRole } from "@/interfaces/session";
import { isEnumValue } from "@/lib/enum";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/public-paths";

/**
 * Whether this browser looks signed in, and with which primary role, for the Next.js proxy alone.
 *
 * The real session is the API's HttpOnly cookie on api.menton.com.tr, which this host's proxy never sees. So the
 * browser writes this first-party cookie when it signs in, and drops it when it signs out or the API answers that
 * there is no session. It is a hint only and is never trusted for access: every call is decided by the backend on
 * its own cookie. A forged or stale hint only changes which page loads first (the login page or the app, the web
 * pages or the phone ones); the page then reads the real session and sends a signed-out visitor to log in.
 */
export const SIGNED_IN_HINT_COOKIE = "menton_signed_in";

/** The role the hint names, or null for a missing or unknown value (which counts as signed out). */
export function signedInHintRole(value: string | null | undefined) {
  return isEnumValue(UserRole, value) ? value : null;
}

function cookieSuffix(maxAgeSeconds?: number) {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  return `; path=/; samesite=lax${
    maxAgeSeconds === undefined ? "" : `; max-age=${maxAgeSeconds}`
  }${secure ? "; secure" : ""}`;
}

/** The hint this browser holds now, or null. */
export function readSignedInHint() {
  if (typeof document === "undefined") return null;
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SIGNED_IN_HINT_COOKIE}=`));
  return signedInHintRole(entry?.slice(SIGNED_IN_HINT_COOKIE.length + 1));
}

/**
 * Writes the hint for `role`. With "beni hatırla" it lasts as long as the API's session cookie; without, it ends
 * when the browser closes, like that cookie does.
 */
export function writeSignedInHint(role: UserRole, remember: boolean) {
  if (typeof document === "undefined") return;
  document.cookie = `${SIGNED_IN_HINT_COOKIE}=${role}${cookieSuffix(
    remember ? SESSION_MAX_AGE_SECONDS : undefined,
  )}`;
}

export function clearSignedInHint() {
  if (typeof document === "undefined") return;
  document.cookie = `${SIGNED_IN_HINT_COOKIE}=${cookieSuffix(0)}`;
}
