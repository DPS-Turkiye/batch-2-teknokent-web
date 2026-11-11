import { setClientTexts } from "@/i18n/client-texts";
import { asLocale, type TestLocale } from "@test/i18n";
import { translatorIn } from "@test/translators";

/** Error texts built outside React (clientText) in the given language; every test starts in Turkish. */
export function clientTextsIn(language: TestLocale) {
  setClientTexts(translatorIn(language, "clientErrors"), asLocale(language));
}
