import { AccountType } from "@/interfaces/account-type";
import type { AppSession } from "@/interfaces/session";
import { accountTypeOfWorkspace, activeWorkspaceOf } from "@/lib/workspaces";

// Signed in, the account decides (accountTypeOfSession). Signed out, this cookie still picks the wording,
// e.g. for a developer previewing the ODTÜ texts on public pages.
export const ACCOUNT_TYPE_COOKIE = "menton_account_type";
export const ACCOUNT_TYPE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function isAccountType(value: unknown): value is AccountType {
  return value === AccountType.Teknokent || value === AccountType.Odtu;
}

/** The saved choice when it is a known type; Teknokent otherwise, so existing users see no change. */
export function resolveAccountType(
  saved: string | null | undefined,
): AccountType {
  return isAccountType(saved) ? saved : AccountType.Teknokent;
}

/** The ODTÜ wording while the account is in an ODTÜ workspace; Teknokent everywhere else. */
export function accountTypeOfSession(session: AppSession): AccountType {
  return accountTypeOfWorkspace(activeWorkspaceOf(session));
}

type Messages = { [key: string]: string | Messages };

/**
 * The base messages with the overlay's texts laid over them, key by key.
 * The overlay only holds the texts that differ for an account type.
 */
export function mergeMessages<T extends Messages>(
  base: T,
  overlay: Messages,
): T {
  const merged: Messages = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    const current = merged[key];
    merged[key] =
      typeof value === "object" && typeof current === "object"
        ? mergeMessages(current, value)
        : value;
  }
  return merged as T;
}
