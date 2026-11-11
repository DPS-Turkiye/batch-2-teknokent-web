"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

import { saveLanguage } from "@/lib/client/auth";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  type Locale,
} from "@/lib/i18n";

/** The current language, and a setter that remembers the choice and re-renders the page in it. */
export function useLanguageSwitch() {
  const router = useRouter();
  const locale = useLocale();
  const setLocale = (next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
    // Only the backend's notification and e-mail wording depends on it, so a failed save must not stop the switch.
    void saveLanguage(next).catch(() => undefined);
    router.refresh();
  };
  return { locale, setLocale };
}
