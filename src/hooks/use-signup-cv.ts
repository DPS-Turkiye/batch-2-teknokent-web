"use client";

import { useRef, useState } from "react";

import { useAiFeatureRefusal, useAiFeatures } from "@/hooks/use-ai-features";
import { useCvParse } from "@/hooks/use-cv-parse";
import type { SignupWizard } from "@/hooks/use-signup-wizard";
import { BIO_MAX_LENGTH, type UploadedFile } from "@/interfaces/signup";
import { applyCvParse } from "@/lib/cv-suggestions";

/**
 * The signup CV field: a chosen CV is kept on the draft and, where profile parsing is on and the person has ticked
 * the reading consent, read to suggest the role and bio. Without the consent (unticked by default) the CV is only
 * kept and the person types the fields themselves.
 */
export function useSignupCv(wizard: SignupWizard) {
  const canRead = useAiFeatures().profileParsing;
  const refused = useAiFeatureRefusal();
  const cvParse = useCvParse();
  const [consent, setConsentState] = useState(false);
  // Read when the parse resolves, so a consent taken back meanwhile is honoured.
  const consentRef = useRef(false);
  // The file last sent for reading, so ticking the box again does not send it twice.
  const readFile = useRef<File | null>(null);
  const { draft, updatePersonal } = wizard;
  const { personal } = draft;

  function read(file: File, consentAccepted: boolean) {
    if (readFile.current === file) return;
    readFile.current = file;
    cvParse.mutate(
      { source: file, consentAccepted },
      {
        onSuccess: (parsed) => {
          if (!consentRef.current) return;
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
          // A failed read may be tried again with the same file.
          readFile.current = null;
          refused(error);
        },
      },
    );
  }

  function choose(file: UploadedFile | null) {
    updatePersonal("cv", file);
    if (file?.file && canRead && consent) read(file.file, consent);
  }

  /** Ticking the box is the consent itself, so a CV already waiting is read then. */
  function setConsent(next: boolean) {
    consentRef.current = next;
    setConsentState(next);
    const waiting = personal.cv?.file;
    if (next && waiting && canRead && !cvParse.isPending) read(waiting, next);
  }

  return {
    choose,
    canRead,
    consent,
    setConsent,
    isReading: cvParse.isPending,
    error: cvParse.error?.message ?? null,
  };
}
