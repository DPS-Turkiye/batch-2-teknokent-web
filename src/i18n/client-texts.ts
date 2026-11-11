"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";

import { isLocale, Locale } from "@/lib/i18n";

type ClientTranslator = ReturnType<typeof useTranslations<"clientErrors">>;
type ClientTextKey = Parameters<ClientTranslator>[0];

// Error texts are built in plain modules (lib/client, lib/firebase) that cannot call hooks;
// the root layout hands them the active translator so they need not bundle both message files.
let translate: ClientTranslator | null = null;
let activeLocale: Locale = Locale.Tr;

export function setClientTexts(
  translator: ClientTranslator | null,
  locale: string = Locale.Tr,
) {
  translate = translator;
  activeLocale = isLocale(locale) ? locale : Locale.Tr;
}

/** The language the app is shown in, for plain modules that cannot call useLocale. */
export function clientLocale(): Locale {
  return activeLocale;
}

/** A `clientErrors` message in the active language; the key itself before the app has mounted. */
export function clientText(
  key: ClientTextKey,
  values?: Record<string, string | number>,
): string {
  return translate ? translate(key, values) : key;
}

/** True when `clientErrors` has this key, for keys built at runtime (Firebase error codes). */
export function hasClientText(key: string): key is ClientTextKey {
  return translate?.has(key as ClientTextKey) ?? false;
}

export function ClientTexts() {
  const t = useTranslations("clientErrors");
  const locale = useLocale();
  useEffect(() => setClientTexts(t, locale), [t, locale]);
  return null;
}
