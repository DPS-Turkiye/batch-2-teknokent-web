import { AccountType } from "@/interfaces/account-type";

// Until the account type is stored with the account, the choice lives in this cookie.
// Only resolveAccountType and the readers in lib/server/account-type.ts know where it comes from,
// so moving it to the session later changes nothing else.
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
