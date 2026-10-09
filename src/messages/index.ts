import { Locale } from "@/lib/i18n";
import { en } from "@/messages/en";
import { tr, type Messages } from "@/messages/tr";

export type { Messages };

export function messagesFor(locale: Locale): Messages {
  return locale === Locale.En ? en : tr;
}
