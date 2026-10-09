"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

import {
  type Locale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/i18n";

/** The current language, and a setter that remembers the choice and re-renders the page in it. */
export function useLanguageSwitch() {
  const router = useRouter();
  const locale = useLocale();
  const setLocale = (next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
    router.refresh();
  };
  return { locale, setLocale };
}
