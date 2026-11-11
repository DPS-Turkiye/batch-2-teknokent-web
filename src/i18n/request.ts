import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

import { AccountType } from "@/interfaces/account-type";
import { mergeMessages } from "@/lib/account-type";
import { Locale, LOCALE_COOKIE, resolveLocale } from "@/lib/i18n";
import { getAccountType } from "@/lib/server/account-type";

import type trProductTour from "../messages/product-tour/tr.json";
import type trProfileTools from "../messages/profile-tools/tr.json";
import type trMessages from "../messages/tr.json";

type BaseMessages = typeof trMessages & {
  profileTools: typeof trProfileTools;
  productTour: typeof trProductTour;
};

async function baseMessages(locale: Locale): Promise<BaseMessages> {
  if (locale === Locale.En) {
    return {
      ...(await import("../messages/en.json")).default,
      profileTools: (await import("../messages/profile-tools/en.json")).default,
      productTour: (await import("../messages/product-tour/en.json")).default,
    };
  }
  return {
    ...(await import("../messages/tr.json")).default,
    profileTools: (await import("../messages/profile-tools/tr.json")).default,
    productTour: (await import("../messages/product-tour/tr.json")).default,
  };
}

async function odtuMessages(locale: Locale) {
  return locale === Locale.En
    ? (await import("../messages/odtu/en.json")).default
    : (await import("../messages/odtu/tr.json")).default;
}

// No locale in the URL: the saved choice, then the browser's language, decide (see resolveLocale).
// ODTÜ accounts get the messages/odtu overlay laid over the base texts (student and academic wording).
export default getRequestConfig(async () => {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  const locale = resolveLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerList.get("accept-language"),
  );
  const accountType = await getAccountType();
  const base = await baseMessages(locale);
  return {
    locale,
    messages:
      accountType === AccountType.Odtu
        ? mergeMessages(base, await odtuMessages(locale))
        : base,
  };
});
