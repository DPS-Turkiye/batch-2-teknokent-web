import { cookies } from "next/headers";
import "server-only";

import type { AccountType } from "@/interfaces/account-type";
import { ACCOUNT_TYPE_COOKIE, resolveAccountType } from "@/lib/account-type";

/**
 * The account type the current request is shown for. The session lives on the API, out of this server's sight,
 * so the browser writes the signed-in session's type into the cookie (saveAccountTypeCookie); it only picks texts.
 */
export async function getAccountType(): Promise<AccountType> {
  const cookieStore = await cookies();
  return resolveAccountType(cookieStore.get(ACCOUNT_TYPE_COOKIE)?.value);
}
