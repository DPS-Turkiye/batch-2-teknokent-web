import type { MobileTexts } from "@/lib/mobile";
import { asLocale, type TestLocale } from "@test/i18n";
import { translatorIn } from "@test/translators";

/** The phone screens' texts in the given language, as useMobileTexts builds them. */
export function mobileTexts(language: TestLocale = "tr"): MobileTexts {
  const options = translatorIn(language, "optionValues");
  const label = (group: string, value: string) => {
    // A saved value is its own message key (useOptionLabel); has() checks it before t() reads it.
    const key = `${group}.${value}` as Parameters<typeof options>[0];
    return options.has(key) ? options(key) : value;
  };
  return {
    t: translatorIn(language, "mobile"),
    locale: asLocale(language),
    topicLabel: (value) => {
      const area = label("supportArea", value);
      return area !== value ? area : label("mentorTopic", value);
    },
  };
}
