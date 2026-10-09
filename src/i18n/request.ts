import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { LOCALE_COOKIE, resolveLocale } from "@/lib/i18n";

// No locale in the URL: the saved choice, then the browser's language, decide (see resolveLocale).
export default getRequestConfig(async () => {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  const locale = resolveLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerList.get("accept-language"),
  );
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
