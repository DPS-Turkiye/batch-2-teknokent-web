import { Edition } from "@/interfaces/edition";
import { isEnumValue } from "@/lib/enum";

/**
 * Page trees only one edition serves; the other edition answers them like a route that does not exist. The
 * backend closes the matching /api paths, so these lists only keep the screens out of sight.
 */
const OWN_PATH_PREFIXES: Record<Edition, readonly string[]> = {
  // /invite is invite-code sign-up into a startup team, which the ODTÜ deployment closes on the backend too.
  [Edition.Teknokent]: ["/m", "/assistant", "/auth/otg", "/invite"],
  [Edition.Odtu]: [
    "/student",
    "/academician",
    "/office-hours",
    "/lti",
    "/login/odtu",
  ],
};

/**
 * Where the proxy rewrites a closed page: an underscore folder is private in the App Router, so this never becomes
 * a route and always renders the app's not-found page with a 404.
 */
export const EDITION_CLOSED_PATH = "/_edition-closed";

/**
 * APP_EDITION, with unset or blank meaning Teknokent: the Amplify build writes every key it lists, so a key the
 * console leaves out arrives as an empty string. A value that is set but unknown is a typo and stops the request
 * rather than silently opening the wrong screens.
 */
export function parseEdition(value: string | undefined): Edition {
  const normalized = value?.trim().toUpperCase() ?? "";
  if (normalized === "") return Edition.Teknokent;
  if (isEnumValue(Edition, normalized)) return normalized;
  throw new Error(`APP_EDITION must be TEKNOKENT or ODTU, not "${value}".`);
}

function decodedPath(pathname: string) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

function isUnder(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** False for a page tree that belongs to another edition. */
export function isPathOpenIn(edition: Edition, pathname: string) {
  const path = decodedPath(pathname);
  return Object.values(Edition)
    .filter((other) => other !== edition)
    .every((other) =>
      OWN_PATH_PREFIXES[other].every((prefix) => !isUnder(path, prefix)),
    );
}

/**
 * The edition a session belongs to. A cookie from before editions (or no session) reads as Teknokent, the default
 * `workspacesOf` uses too.
 */
export function editionOf(
  session: { edition?: Edition | undefined } | null | undefined,
): Edition {
  return session?.edition ?? Edition.Teknokent;
}
