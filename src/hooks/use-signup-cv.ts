"use client";

import { useAiFeatureRefusal, useAiFeatures } from "@/hooks/use-ai-features";
import { useCvParse } from "@/hooks/use-cv-parse";
import type { SignupWizard } from "@/hooks/use-signup-wizard";
import { BIO_MAX_LENGTH, type UploadedFile } from "@/interfaces/signup";
import { applyCvParse } from "@/lib/cv-suggestions";

/**
 * The signup CV field: a chosen CV is kept on the draft and, where profile parsing is on, read to suggest the
 * role and bio. Where it is off the CV is only kept and the person types the fields themselves.
 */
export function useSignupCv(wizard: SignupWizard) {
  const canRead = useAiFeatures().profileParsing;
  const refused = useAiFeatureRefusal();
  const cvParse = useCvParse();
  const { draft, updatePersonal } = wizard;
  const { personal } = draft;

  function choose(file: UploadedFile | null) {
    updatePersonal("cv", file);
    if (!file?.file || !canRead) return;
    cvParse.mutate(file.file, {
      onSuccess: (parsed) => {
        // Suggestions, not an overwrite: anything already typed wins.
        const next = applyCvParse(
          { role: personal.role, bio: personal.bio, expertise: [] },
          parsed,
          { keepFilled: true, bioMaxLength: BIO_MAX_LENGTH },
        );
        if (next.role !== personal.role) updatePersonal("role", next.role);
        if (next.bio !== personal.bio) updatePersonal("bio", next.bio);
      },
      onError: (error) => {
        refused(error);
      },
    });
  }

  return {
    choose,
    canRead,
    isReading: cvParse.isPending,
    error: cvParse.error?.message ?? null,
  };
}
