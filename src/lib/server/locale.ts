import "server-only";

import { cookies, headers } from "next/headers";

import { LOCALE_COOKIE, resolveLocale } from "@/lib/i18n";

export async function getLocale() {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  return resolveLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerList.get("accept-language"),
  );
}
