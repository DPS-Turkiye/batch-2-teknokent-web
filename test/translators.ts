import { createTranslator } from "next-intl";

import {
  appMessages,
  asLocale,
  type MessageNamespace,
  type TestLocale,
} from "@test/i18n";

/** A `namespace` translator over the app's messages in the given language, as useTranslations gives one. */
export function translatorIn<Namespace extends MessageNamespace>(
  locale: TestLocale,
  namespace: Namespace,
) {
  return createTranslator({
    locale: asLocale(locale),
    messages: appMessages(locale),
    namespace,
  });
}
