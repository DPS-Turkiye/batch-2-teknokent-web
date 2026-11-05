"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  BIO_MAX_LENGTH,
  ContactPreference,
  MAX_SUPPORT_AREAS,
  SIGNUP_STEP_ORDER,
  SignupStep,
  StartupDocumentKind,
  TAGLINE_MAX_LENGTH,
  type PersonalProfileDraft,
  type SignupDraft,
} from "@/interfaces/signup";
import { useOnboardingDraftSync } from "@/hooks/use-onboarding-draft-sync";
import {
  emptySignupDraft,
  toggle,
  useStartupDraftEditors,
} from "@/hooks/use-startup-draft";
import type { OnboardingDraftRecord } from "@/interfaces/onboarding-draft";
import { dropDetachedFile } from "@/lib/draft-storage";
import { scrollToTop } from "@/lib/utils";

const DRAFT_KIND = "signup-wizard" as const;

function restoreFromPayload(saved: unknown): {
  draft: SignupDraft;
  droppedFiles: number;
} {
  if (!saved || typeof saved !== "object") {
    return { draft: emptySignupDraft(), droppedFiles: 0 };
  }
  const parsed = saved as Partial<SignupDraft>;
  const base = emptySignupDraft();
  const cv = dropDetachedFile(parsed.personal?.cv ?? null);
  const logo = dropDetachedFile(parsed.startup?.logo ?? null);

  let dropped = cv.dropped + logo.dropped;
  const documents: SignupDraft["documents"] = {};
  for (const [kind, uploaded] of Object.entries(parsed.documents ?? {})) {
    const kept = dropDetachedFile(uploaded ?? null);
    dropped += kept.dropped;
    if (kept.value) documents[kind as StartupDocumentKind] = kept.value;
  }

  return {
    draft: {
      personal: { ...base.personal, ...parsed.personal, cv: cv.value },
      startup: { ...base.startup, ...parsed.startup, logo: logo.value },
      documents,
      mvpUrl: parsed.mvpUrl ?? "",
      consent: false,
    },
    droppedFiles: dropped,
  };
}

export function useSignupWizard(
  options: { onSubmit?: (draft: SignupDraft) => Promise<void> } = {},
) {
  const [step, setStep] = useState<SignupStep>(SignupStep.PersonalProfile);
  const [draft, setDraft] = useState<SignupDraft>(emptySignupDraft);
  const [droppedFiles, setDroppedFiles] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);

  const onRestore = useCallback((saved: OnboardingDraftRecord) => {
    const restored = restoreFromPayload(saved.payload);
    setDraft(restored.draft);
    setDroppedFiles(restored.droppedFiles);
    const nextStep = Number(saved.step) as SignupStep;
    if (SIGNUP_STEP_ORDER.includes(nextStep)) setStep(nextStep);
  }, []);

  const { saveNow, clearRemote } = useOnboardingDraftSync({
    kind: DRAFT_KIND,
    step,
    payload: draft,
    onRestore,
  });

  const updatePersonal = useCallback(
    <K extends keyof PersonalProfileDraft>(
      key: K,
      value: PersonalProfileDraft[K],
    ) => {
      setDraft((current) => ({
        ...current,
        personal: { ...current.personal, [key]: value },
      }));
    },
    [],
  );

  const toggleContactPreference = useCallback((value: ContactPreference) => {
    setDraft((current) => ({
      ...current,
      personal: {
        ...current.personal,
        contactPreferences: toggle(current.personal.contactPreferences, value),
      },
    }));
  }, []);

  const setConsent = useCallback((consent: boolean) => {
    setDraft((current) => ({ ...current, consent }));
  }, []);

  const editors = useStartupDraftEditors(setDraft);

  // Without a startup there are no startup files to ask for.
  const steps = useMemo(
    () =>
      draft.startup.startupLater
        ? SIGNUP_STEP_ORDER.filter((item) => item !== SignupStep.Documents)
        : SIGNUP_STEP_ORDER,
    [draft.startup.startupLater],
  );

  // A step is a new page to the applicant, so it should start at its heading
  // rather than wherever the previous one was scrolled to.
  useEffect(() => {
    scrollToTop();
  }, [step]);

  const goToStep = useCallback((next: SignupStep) => setStep(next), []);

  const goNext = useCallback(() => {
    setStep((current) => steps[steps.indexOf(current) + 1] ?? current);
  }, [steps]);

  const goBack = useCallback(() => {
    setStep((current) => steps[steps.indexOf(current) - 1] ?? current);
  }, [steps]);

  const onSubmit = options.onSubmit;
  const submit = useCallback(async () => {
    setSubmitError("");
    if (!onSubmit) {
      setSubmitted(true);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(draft);
      await clearRemote();
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Başvuru gönderilemedi. Lütfen tekrar deneyin.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [clearRemote, draft, onSubmit]);

  const saveDraft = useCallback(async () => {
    await saveNow();
    setDraftSavedAt(Date.now());
  }, [saveNow]);

  const bioRemaining = BIO_MAX_LENGTH - draft.personal.bio.length;
  const taglineRemaining = TAGLINE_MAX_LENGTH - draft.startup.tagline.length;

  const canContinue = useMemo(() => {
    if (step === SignupStep.PersonalProfile) {
      const { firstName, lastName, role } = draft.personal;
      return Boolean(firstName.trim() && lastName.trim() && role.trim());
    }
    if (step === SignupStep.StartupProfile) {
      const { name, tagline, programId, startupLater } = draft.startup;
      return Boolean(
        programId && (startupLater || (name.trim() && tagline.trim())),
      );
    }
    if (step === SignupStep.Review) return draft.consent;
    return true;
  }, [draft, step]);

  return {
    step,
    steps,
    draft,
    submitted,
    submitting,
    submitError,
    draftSavedAt,
    droppedFiles,
    bioRemaining,
    taglineRemaining,
    canContinue,
    supportAreaLimitReached:
      draft.startup.supportAreas.length >= MAX_SUPPORT_AREAS,
    isFirstStep: step === SignupStep.PersonalProfile,
    isLastStep: step === SignupStep.Review,
    goToStep,
    goNext,
    goBack,
    submit,
    saveDraft,
    toggleContactPreference,
    setConsent,
    updatePersonal,
    ...editors,
  };
}

export type SignupWizard = ReturnType<typeof useSignupWizard>;
