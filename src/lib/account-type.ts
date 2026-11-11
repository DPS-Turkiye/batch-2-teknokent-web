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

/** A message file's value: a text, a list (of texts or of nested messages), or a nested group. */
type MessageValue = string | readonly MessageValue[] | Messages;
type Messages = { readonly [key: string]: MessageValue };

function isMessageGroup(value: MessageValue | undefined): value is Messages {
  return typeof value === "object" && !Array.isArray(value);
}

/**
 * The base messages with the overlay's texts laid over them, key by key.
 * The overlay only holds the texts that differ for an account type; a list it names replaces the base list whole.
 */
export function mergeMessages<T extends Messages>(
  base: T,
  overlay: Messages,
): T {
  const merged: Record<string, MessageValue> = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    const current = merged[key];
    merged[key] =
      isMessageGroup(value) && isMessageGroup(current)
        ? mergeMessages(current, value)
        : value;
  }
  return merged as T;
}
