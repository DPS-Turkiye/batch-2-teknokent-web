"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

import { useTopicLabel } from "@/hooks/use-option-label";
import type { MobileTexts } from "@/lib/mobile";

/** What lib/mobile-* needs to build its labels in the page's language. */
export function useMobileTexts(): MobileTexts {
  const t = useTranslations("mobile");
  const locale = useLocale();
  const topicLabel = useTopicLabel();
  return useMemo(() => ({ t, locale, topicLabel }), [t, locale, topicLabel]);
}
