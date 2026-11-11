import type { Locale } from "@/lib/i18n";
import type productTour from "@/messages/product-tour/tr.json";
import type profileTools from "@/messages/profile-tools/tr.json";
import type messages from "@/messages/tr.json";

// Every translation key is checked against the Turkish source file.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages & {
      profileTools: typeof profileTools;
      productTour: typeof productTour;
    };
  }
}
