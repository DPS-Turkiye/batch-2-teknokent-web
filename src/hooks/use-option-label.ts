"use client";

import { useTranslations } from "next-intl";

/** The option lists whose values are saved as their Turkish text (`optionValues` in the messages). */
export type OptionGroup =
  | "stage"
  | "stageDescription"
  | "supportArea"
  | "mentorTopic"
  | "meetingFormat"
  | "responseTime"
  | "fundingStage";

/**
 * Shows a saved option value in the page's language. The saved value is the
 * message key, so the data keeps its Turkish text; a value the list doesn't
 * know (typed by hand, or from an older list) shows as stored.
 */
export function useOptionLabel() {
  const t = useTranslations("optionValues");
  return (group: OptionGroup, value: string) => {
    const key = `${group}.${value}` as Parameters<typeof t>[0];
    return t.has(key) ? t(key) : value;
  };
}
