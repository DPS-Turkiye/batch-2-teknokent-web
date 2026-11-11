/**
 * "OTG ile giriş yap" (ODTÜ TEKNOKENT Girişimcilik). Both paths are fixed by OTG's client registration:
 * the callback must match the registered redirect URI exactly, and OTG's "Menton'a git" button opens the
 * start path with no parameters.
 */
export const OTG_START_PATH = "/auth/otg/start";
export const OTG_CALLBACK_PATH = "/auth/otg/callback";

/** The backend gives every Firebase login it makes for an OTG person the uid otg_<their OTG id>. */
export const OTG_UID_PREFIX = "otg_";

/** Off unless this build sets it, so a deployment that has not been registered with OTG shows nothing. */
export function isOtgLoginEnabled(): boolean {
  return process.env.NEXT_PUBLIC_OTG_LOGIN_ENABLED === "true";
}

/** The start path, carrying where to land afterwards when there is somewhere. */
export function otgStartHref(next: string | null) {
  return next
    ? `${OTG_START_PATH}?${new URLSearchParams({ next })}`
    : OTG_START_PATH;
}

/** ?otg=<value> on the login page: the OTG sign-in could not be started. */
export enum OtgLoginFailure {
  Failed = "hata",
}
