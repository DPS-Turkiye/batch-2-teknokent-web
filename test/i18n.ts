import type {
  createTranslator,
  Messages,
  NamespaceKeys,
  NestedKeyOf,
} from "next-intl";

import { Locale } from "@/lib/i18n";
import en from "@/messages/en.json";
import toolsEn from "@/messages/profile-tools/en.json";
import toolsTr from "@/messages/profile-tools/tr.json";
import tr from "@/messages/tr.json";

/** A language as tests name it: the enum, or its plain string ("tr" | "en"). */
export type TestLocale = Locale | `${Locale}`;

const LOCALES: Record<TestLocale, Locale> = {
  tr: Locale.Tr,
  en: Locale.En,
};

export function asLocale(locale: TestLocale): Locale {
  return LOCALES[locale];
}

/** Every message the app's request config hands the provider in this language (src/i18n/request.ts). */
export function appMessages(locale: TestLocale): Messages {
  return asLocale(locale) === Locale.En
    ? { ...en, profileTools: toolsEn }
    : { ...tr, profileTools: toolsTr };
}

export type MessageNamespace = NamespaceKeys<Messages, NestedKeyOf<Messages>>;

/**
 * The Turkish translator a component reads when it renders without NextIntlClientProvider, as
 * production does with no locale cookie. `create` is next-intl's createTranslator, passed in
 * because the next-intl mock in test/setup.ts cannot import the module it is replacing.
 */
export function turkishTranslator<Namespace extends MessageNamespace = never>(
  create: typeof createTranslator,
  namespace?: Namespace,
) {
  const config = { locale: Locale.Tr, messages: appMessages(Locale.Tr) };
  return namespace === undefined
    ? create<Messages, Namespace>(config)
    : create<Messages, Namespace>({ ...config, namespace });
}
