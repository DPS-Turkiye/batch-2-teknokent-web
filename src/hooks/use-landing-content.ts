"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { Locale } from "@/lib/i18n";
import { LANDING_CONTENT } from "@/lib/const/landing";
import { LANDING_CONTENT_EN } from "@/lib/const/landing.en";

/** The landing page's text in the visitor's language. */
export function useLandingContent() {
  const { locale } = useLocale();
  return locale === Locale.En ? LANDING_CONTENT_EN : LANDING_CONTENT;
}
