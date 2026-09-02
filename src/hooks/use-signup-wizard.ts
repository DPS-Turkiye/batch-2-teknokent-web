"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  BIO_MAX_LENGTH,
  DOCUMENT_CHECKLIST,
  PROGRAM_LEVEL_OPTIONS,
  SIGNUP_STEP_ORDER,
  SignupStep,
  StartupDocumentKind,
  TAGLINE_MAX_LENGTH,
  type PersonalProfileDraft,
  type SignupDraft,
  type StartupProfileDraft,
  type UploadedFile,
} from "@/interfaces/signup";
import {
  clearDraft,
  dropDetachedFile,
  loadDraft,
  saveDraft as persistDraft,
} from "@/lib/draft-storage";

function emptyDraft(): SignupDraft {
  return {
    personal: {
      firstName: "",
      lastName: "",
      role: "",
      bio: "",
      linkedin: "",
      expertise: [],
      contactPreferences: [],
      cv: null,
    },
    startup: {
      name: "",
      tagline: "",
      website: "",
      programId: null,
      problem: "",
      solution: "",
      currentSolution: "",
      targetUser: "",
      sector: "",
      maturity: "",
      supportAreas: [],
      programLevel: PROGRAM_LEVEL_OPTIONS[0],
      logo: null,
    },
    documents: {},
  };
}

function toggle(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

const DRAFT_KEY = "signup-wizard";

function restoreDraft(): { draft: SignupDraft; droppedFiles: number } {
  const saved = loadDraft<SignupDraft>(DRAFT_KEY);
  if (!saved) return { draft: emptyDraft(), droppedFiles: 0 };

  const base = emptyDraft();
  const cv = dropDetachedFile(saved.personal?.cv ?? null);
  const logo = dropDetachedFile(saved.startup?.logo ?? null);

  let dropped = cv.dropped + logo.dropped;
  const documents: SignupDraft["documents"] = {};
  for (const [kind, uploaded] of Object.entries(saved.documents ?? {})) {
    const kept = dropDetachedFile(uploaded ?? null);
    dropped += kept.dropped;
    if (kept.value) documents[kind as StartupDocumentKind] = kept.value;
  }

  return {
    draft: {
      personal: { ...base.personal, ...saved.personal, cv: cv.value },
      startup: { ...base.startup, ...saved.startup, logo: logo.value },
      documents,
    },
    droppedFiles: dropped,
  };
}

export function useSignupWizard(
  options: { onSubmit?: (draft: SignupDraft) => Promise<void> } = {},
) {
  const [step, setStep] = useState<SignupStep>(SignupStep.PersonalProfile);
  const [restored] = useState(restoreDraft);
  const [draft, setDraft] = useState<SignupDraft>(restored.draft);
  const droppedFiles = restored.droppedFiles;
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);

  useEffect(() => {
    persistDraft(DRAFT_KEY, draft);
  }, [draft]);

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

  // Expertise is free-form now: values come from the parsed CV or the user's own
  // typing, so the step replaces the whole set rather than toggling a fixed list.
  const setExpertise = useCallback((values: string[]) => {
    setDraft((current) => ({
      ...current,
      personal: { ...current.personal, expertise: values },
    }));
  }, []);

  const toggleSupportArea = useCallback((value: string) => {
    setDraft((current) => ({
      ...current,
      startup: {
        ...current.startup,
        supportAreas: toggle(current.startup.supportAreas, value),
      },
    }));
  }, []);

  const toggleContactPreference = useCallback((value: string) => {
    setDraft((current) => ({
      ...current,
      personal: {
        ...current.personal,
        contactPreferences: toggle(current.personal.contactPreferences, value),
      },
    }));
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
      clearDraft(DRAFT_KEY);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "The application could not be submitted. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [draft, onSubmit]);

  const saveDraft = useCallback(() => setDraftSavedAt(Date.now()), []);

  const bioRemaining = BIO_MAX_LENGTH - draft.personal.bio.length;
  const taglineRemaining = TAGLINE_MAX_LENGTH - draft.startup.tagline.length;

  const checklist = useMemo(
    () =>
      DOCUMENT_CHECKLIST.map((item) => ({
        ...item,
        done: Boolean(draft.documents[item.kind]),
      })),
    [draft.documents],
  );

  const completion = useMemo(() => {
    const { personal, startup, documents } = draft;
    const checks: { label: string; done: boolean }[] = [
      { label: "Ad", done: Boolean(personal.firstName.trim()) },
      { label: "Soyad", done: Boolean(personal.lastName.trim()) },
      { label: "Rol", done: Boolean(personal.role.trim()) },
      { label: "Kısa tanıtım", done: Boolean(personal.bio.trim()) },
      { label: "LinkedIn", done: Boolean(personal.linkedin.trim()) },
      { label: "CV", done: Boolean(personal.cv) },
      { label: "Uzmanlık alanları", done: personal.expertise.length > 0 },
      { label: "Startup adı", done: Boolean(startup.name.trim()) },
      { label: "Tek satırlık tanım", done: Boolean(startup.tagline.trim()) },
      { label: "Web sitesi URL'i", done: Boolean(startup.website.trim()) },
      { label: "Problem", done: Boolean(startup.problem.trim()) },
      { label: "Çözüm", done: Boolean(startup.solution.trim()) },
      { label: "Hedef kullanıcı", done: Boolean(startup.targetUser.trim()) },
      { label: "Sektör", done: Boolean(startup.sector) },
      { label: "Olgunluk seviyesi", done: Boolean(startup.maturity) },
      { label: "Destek alanları", done: startup.supportAreas.length > 0 },
      { label: "Dosyalar", done: Object.keys(documents).length > 0 },
    ];
    const done = checks.filter((c) => c.done).length;
    return {
      percent: Math.round((done / checks.length) * 100),
      missing: checks.filter((c) => !c.done).map((c) => c.label),
    };
  }, [draft]);

  const canContinue = useMemo(() => {
    if (step === SignupStep.PersonalProfile) {
      const { firstName, lastName, role } = draft.personal;
      return Boolean(firstName.trim() && lastName.trim() && role.trim());
    }
    if (step === SignupStep.StartupProfile) {
      const { name, tagline, website } = draft.startup;
      return Boolean(name.trim() && tagline.trim() && website.trim());
    }
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
    checklist,
    completion,
    canContinue,
    isFirstStep: step === SignupStep.PersonalProfile,
    isLastStep: step === SignupStep.Review,
    goToStep,
    goNext,
    goBack,
    submit,
    saveDraft,
    setDocument,
    toggleContactPreference,
    setExpertise,
    toggleSupportArea,
    updatePersonal,
    updateStartup,
  };
}

export type SignupWizard = ReturnType<typeof useSignupWizard>;
