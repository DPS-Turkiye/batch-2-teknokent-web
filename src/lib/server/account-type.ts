import "server-only";

import { cookies } from "next/headers";

import type { AccountType } from "@/interfaces/account-type";
import { ACCOUNT_TYPE_COOKIE, resolveAccountType } from "@/lib/account-type";

/** The account type the current request is shown for. */
export async function getAccountType(): Promise<AccountType> {
  const cookieStore = await cookies();
  return resolveAccountType(cookieStore.get(ACCOUNT_TYPE_COOKIE)?.value);
}
