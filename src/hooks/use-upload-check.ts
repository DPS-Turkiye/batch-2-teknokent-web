"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";

import type { UploadedFile } from "@/interfaces/signup";
import {
  ONBOARDING_UPLOAD_RULES,
  uploadAccept,
  uploadProblem,
  uploadTypesLabel,
  type OnboardingUploadKind,
} from "@/lib/upload-rules";
import { formatFileSize } from "@/lib/utils";
import { UploadProblem } from "@/types/upload";

/**
 * Checks a picked file against what the backend takes for its kind, before anything is sent, and words the refusal.
 * Gives the field its `accept` filter and the "PDF veya DOCX · en fazla 25 MB" hint from the same rule.
 */
export function useUploadCheck(kind: OnboardingUploadKind) {
  const t = useTranslations("uploadCheck");
  const locale = useLocale();
  const [problem, setProblem] = useState<UploadProblem | null>(null);
  const hintId = useId();
  const errorId = useId();
  const rule = ONBOARDING_UPLOAD_RULES[kind];
  const types = uploadTypesLabel(rule, locale);
  const max = formatFileSize(rule.maxBytes);

  function problemText(found: UploadProblem) {
    switch (found) {
      case UploadProblem.Empty:
        return t("empty");
      case UploadProblem.VideoAsLink:
        return t("videoAsLink", { types });
      case UploadProblem.WrongType:
        return t("wrongType", { types });
      case UploadProblem.TooLarge:
        return t("tooLarge", { max });
    }
  }

  /** The picked file as a draft upload, or null (with `error` set) when the backend would refuse it. */
  function take(selected: File | undefined): UploadedFile | null {
    if (!selected) return null;
    const found = uploadProblem(selected, rule);
    setProblem(found);
    if (found) return null;
    return { name: selected.name, size: selected.size, file: selected };
  }

  const error = problem ? problemText(problem) : null;
  return {
    accept: uploadAccept(rule),
    hint: t("hint", { types, max }),
    hintId,
    error,
    errorId,
    /** For the visible control that opens the picker: points it at the refusal while one shows. */
    errorDescribedBy: error ? errorId : undefined,
    take,
    /** Drops a refusal that no longer applies, such as after the chosen file is removed. */
    clear: () => setProblem(null),
  };
}
