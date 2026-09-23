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
  type StartupProfileDraft,
  type TeamMemberDraft,
  type UploadedFile,
} from "@/interfaces/signup";
import { useOnboardingDraftSync } from "@/hooks/use-onboarding-draft-sync";
import type { OnboardingDraftRecord } from "@/interfaces/onboarding-draft";
import { dropDetachedFile } from "@/lib/draft-storage";
import { scrollToTop } from "@/lib/utils";

function emptyDraft(): SignupDraft {
  return {
    personal: {
      firstName: "",
      lastName: "",
      role: "",
      bio: "",
      linkedin: "",
      contactPreferences: [],
      cv: null,
    },
    startup: {
      name: "",
      tagline: "",
      website: "",
      foundedYear: "",
      programId: null,
      maturity: "",
      teamMembers: [],
      supportAreas: [],
      logo: null,
    },
    documents: {},
    mvpUrl: "",
    consent: false,
  };
}

function toggle<T>(list: T[], value: T) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

const DRAFT_KIND = "signup-wizard" as const;

function restoreFromPayload(saved: unknown): {
  draft: SignupDraft;
  droppedFiles: number;
} {
  if (!saved || typeof saved !== "object") {
    return { draft: emptyDraft(), droppedFiles: 0 };
  }
  const parsed = saved as Partial<SignupDraft>;
  const base = emptyDraft();
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
  const [draft, setDraft] = useState<SignupDraft>(emptyDraft);
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

  const updateStartup = useCallback(
    <K extends keyof StartupProfileDraft>(
      key: K,
      value: StartupProfileDraft[K],
    ) => {
      setDraft((current) => ({
        ...current,
        startup: { ...current.startup, [key]: value },
      }));
    },
    [],
  );

  const toggleSupportArea = useCallback((value: string) => {
    setDraft((current) => {
      const selected = current.startup.supportAreas;
      if (!selected.includes(value) && selected.length >= MAX_SUPPORT_AREAS) {
        return current;
      }
      return {
        ...current,
        startup: { ...current.startup, supportAreas: toggle(selected, value) },
      };
    });
  }, []);

  const toggleContactPreference = useCallback((value: ContactPreference) => {
    setDraft((current) => ({
      ...current,
      personal: {
        ...current.personal,
        contactPreferences: toggle(current.personal.contactPreferences, value),
      },
    }));
  }, []);

  const addTeamMember = useCallback((member: TeamMemberDraft) => {
    setDraft((current) => ({
      ...current,
      startup: {
        ...current.startup,
        teamMembers: [...current.startup.teamMembers, member],
      },
    }));
  }, []);

  const removeTeamMember = useCallback((index: number) => {
    setDraft((current) => ({
      ...current,
      startup: {
        ...current.startup,
        teamMembers: current.startup.teamMembers.filter((_, i) => i !== index),
      },
    }));
  }, []);

  const setMvpUrl = useCallback((mvpUrl: string) => {
    setDraft((current) => ({ ...current, mvpUrl }));
  }, []);

  const setConsent = useCallback((consent: boolean) => {
    setDraft((current) => ({ ...current, consent }));
  }, []);

  const setDocument = useCallback(
    (kind: StartupDocumentKind, file: UploadedFile | null) => {
      setDraft((current) => {
        const documents = { ...current.documents };
        if (file) documents[kind] = file;
        else delete documents[kind];
        return { ...current, documents };
      });
    },
    [],
  );

  // A step is a new page to the applicant, so it should start at its heading
  // rather than wherever the previous one was scrolled to.
  useEffect(() => {
    scrollToTop();
  }, [step]);

  const goToStep = useCallback((next: SignupStep) => setStep(next), []);

  const goNext = useCallback(() => {
    setStep((current) => {
      const index = SIGNUP_STEP_ORDER.indexOf(current);
      return SIGNUP_STEP_ORDER[index + 1] ?? current;
    });
  }, []);

  const goBack = useCallback(() => {
    setStep((current) => {
      const index = SIGNUP_STEP_ORDER.indexOf(current);
      return SIGNUP_STEP_ORDER[index - 1] ?? current;
    });
  }, []);

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
      const { name, tagline } = draft.startup;
      return Boolean(name.trim() && tagline.trim());
    }
    if (step === SignupStep.Review) return draft.consent;
    return true;
  }, [draft, step]);

  return {
    step,
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
    setDocument,
    toggleContactPreference,
    toggleSupportArea,
    addTeamMember,
    removeTeamMember,
    setMvpUrl,
    setConsent,
    updatePersonal,
    updateStartup,
  };
}

export type SignupWizard = ReturnType<typeof useSignupWizard>;
