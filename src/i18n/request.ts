import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { AccountType } from "@/interfaces/account-type";
import { mergeMessages } from "@/lib/account-type";
import { LOCALE_COOKIE, resolveLocale } from "@/lib/i18n";
import { getAccountType } from "@/lib/server/account-type";

// No locale in the URL: the saved choice, then the browser's language, decide (see resolveLocale).
// ODTÜ accounts get the messages/odtu overlay laid over the base texts (student and academic wording).
export default getRequestConfig(async () => {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  const locale = resolveLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerList.get("accept-language"),
  );
  const accountType = await getAccountType();
  const base = {
    ...(await import(`../messages/${locale}.json`)).default,
    profileTools: (await import(`../messages/profile-tools/${locale}.json`))
      .default,
  };
  return {
    locale,
    messages:
      accountType === AccountType.Odtu
        ? mergeMessages(
            base,
            (await import(`../messages/odtu/${locale}.json`)).default,
          )
        : base,
  };
});
