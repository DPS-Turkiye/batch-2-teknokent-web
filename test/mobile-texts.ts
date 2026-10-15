import { createTranslator } from "next-intl";

import type { MobileTexts } from "@/lib/mobile";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

/** The phone screens' texts in the given language, as useMobileTexts builds them. */
export function mobileTexts(locale: "tr" | "en" = "tr"): MobileTexts {
  const messages = locale === "en" ? en : tr;
  const options = createTranslator({
    locale,
    messages,
    namespace: "optionValues",
  });
  const label = (group: string, value: string) => {
    const key = `${group}.${value}` as Parameters<typeof options>[0];
    return options.has(key) ? options(key) : value;
  };
  return {
    t: createTranslator({ locale, messages, namespace: "mobile" }),
    locale,
    topicLabel: (value) => {
      const area = label("supportArea", value);
      return area !== value ? area : label("mentorTopic", value);
    },
  };
}
