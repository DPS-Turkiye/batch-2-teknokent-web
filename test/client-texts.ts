import { createTranslator } from "next-intl";

import { setClientTexts } from "@/i18n/client-texts";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

/** Error texts built outside React (clientText) in the given language; every test starts in Turkish. */
export function clientTextsIn(locale: "tr" | "en") {
  setClientTexts(
    createTranslator({
      locale,
      messages: locale === "en" ? en : tr,
      namespace: "clientErrors",
    }),
  );
}
