import "server-only";

import { cookies } from "next/headers";

import type { AccountType } from "@/interfaces/account-type";
import {
  ACCOUNT_TYPE_COOKIE,
  accountTypeOfSession,
  resolveAccountType,
} from "@/lib/account-type";
import { currentSessionUser } from "@/lib/public-paths";
import { getSessionStore } from "@/lib/session";

/**
 * The account type the current request is shown for. Reads the cookie session without asking the backend again:
 * the wording follows the account, and the ten-minute re-check runs on the proxy routes.
 */
export async function getAccountType(): Promise<AccountType> {
  const user = currentSessionUser(await getSessionStore());
  if (user) return accountTypeOfSession(user);
  const cookieStore = await cookies();
  return resolveAccountType(cookieStore.get(ACCOUNT_TYPE_COOKIE)?.value);
}
