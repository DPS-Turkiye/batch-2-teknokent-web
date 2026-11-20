import type { Edition } from "@/interfaces/edition";
import { UserRole } from "@/interfaces/session";
import { editionOf } from "@/lib/edition";
import { offersUserDeletion } from "@/lib/edition-screens";
import { hasPermission } from "@/lib/permissions";

/** The word typed into the account deletion's second confirmation. */
export const ACCOUNT_CONFIRMATION_WORD = "SİL";

/**
 * How recently the person must have signed in for the backend to accept a deletion. The backend allows 15 minutes;
 * a minute less here leaves room for the time spent in the dialog.
 */
export const RECENT_SIGN_IN_MS = 14 * 60 * 1000;

/** The query parameter the landing page reads to say the account was deleted. */
export const ACCOUNT_DELETED_PARAM = "hesap";
export const ACCOUNT_DELETED_VALUE = "silindi";

/**
 * The same rule as the backend: Turkish upper-casing, with a dotless capital I taken as İ, so "sil", "Sil" and "SIL"
 * typed on a keyboard without İ all count.
 */
export function confirmsAccountDeletion(typed: string) {
  return (
    typed.trim().toLocaleUpperCase("tr-TR").replaceAll("I", "İ") ===
    ACCOUNT_CONFIRMATION_WORD
  );
}

/** The startup's name exactly, apart from surrounding spaces: case and diacritics count, as on the backend. */
export function confirmsStartupDeletion(typed: string, name: string) {
  const entered = typed.trim();
  return entered.length > 0 && entered === name.trim();
}

/** Whether a sign-in at `signedInAt` is recent enough for a deletion at `now`; unknown counts as not. */
export function signedInRecently(signedInAt: Date | null, now: Date) {
  if (!signedInAt || Number.isNaN(signedInAt.getTime())) return false;
  return now.getTime() - signedInAt.getTime() <= RECENT_SIGN_IN_MS;
}

/** The landing page address an account deletion ends on. */
export function accountDeletedHref() {
  return `/?${new URLSearchParams({ [ACCOUNT_DELETED_PARAM]: ACCOUNT_DELETED_VALUE })}`;
}

/** Whether a page's query string says the account was just deleted. */
export function saysAccountDeleted(search: string) {
  return (
    new URLSearchParams(search).get(ACCOUNT_DELETED_PARAM) ===
    ACCOUNT_DELETED_VALUE
  );
}

type SelfDeletionViewer = {
  role: UserRole;
  permissions?: readonly UserRole[] | undefined;
  edition?: Edition | undefined;
};

/**
 * Whether to ask the backend what this person may delete at all. Coordinators and admins never may, and an edition
 * without deletion offers none; the backend refuses them too, this only saves the request.
 */
export function asksForSelfDeletion(viewer: SelfDeletionViewer | null) {
  return (
    viewer !== null &&
    offersUserDeletion(editionOf(viewer)) &&
    !hasPermission(viewer, UserRole.Admin) &&
    !hasPermission(viewer, UserRole.Coordinator)
  );
}
