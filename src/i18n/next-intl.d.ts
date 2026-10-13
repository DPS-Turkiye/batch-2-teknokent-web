import type messages from "@/messages/tr.json";
import type { Locale } from "@/lib/i18n";

// Every translation key is checked against the Turkish source file.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
