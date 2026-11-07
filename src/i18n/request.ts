import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { AccountType } from "@/interfaces/account-type";
import {
  ACCOUNT_TYPE_COOKIE,
  mergeMessages,
  resolveAccountType,
} from "@/lib/account-type";
import { LOCALE_COOKIE, resolveLocale } from "@/lib/i18n";

// No locale in the URL: the saved choice, then the browser's language, decide (see resolveLocale).
// ODTÜ accounts get the messages/odtu overlay laid over the base texts (student and academic wording).
export default getRequestConfig(async () => {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  const locale = resolveLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerList.get("accept-language"),
  );
  const accountType = resolveAccountType(
    cookieStore.get(ACCOUNT_TYPE_COOKIE)?.value,
  );
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
