"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

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
  return useCallback(
    (group: OptionGroup, value: string) => {
      const key = `${group}.${value}` as Parameters<typeof t>[0];
      return t.has(key) ? t(key) : value;
    },
    [t],
  );
}

/** A saved request topic, which may come from the support areas or the mentor topics. */
export function useTopicLabel() {
  const optionLabel = useOptionLabel();
  return useCallback(
    (value: string) => {
      const area = optionLabel("supportArea", value);
      return area !== value ? area : optionLabel("mentorTopic", value);
    },
    [optionLabel],
  );
}
