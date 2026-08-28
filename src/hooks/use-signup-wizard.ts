"use client";

import { useCallback, useMemo, useState } from "react";

import {
  BIO_MAX_LENGTH,
  DOCUMENT_CHECKLIST,
  PROGRAM_LEVEL_OPTIONS,
  PROGRAM_OPTIONS,
  SIGNUP_STEP_ORDER,
  SignupStep,
  StartupDocumentKind,
  TAGLINE_MAX_LENGTH,
  type PersonalProfileDraft,
  type SignupDraft,
  type StartupProfileDraft,
  type UploadedFile,
} from "@/interfaces/signup";

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
      program: PROGRAM_OPTIONS[0],
      problem: "",
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

export function useSignupWizard() {
  const [step, setStep] = useState<SignupStep>(SignupStep.PersonalProfile);
  const [draft, setDraft] = useState<SignupDraft>(emptyDraft);
  const [submitted, setSubmitted] = useState(false);

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

  const toggleExpertise = useCallback((value: string) => {
    setDraft((current) => ({
      ...current,
      personal: {
        ...current.personal,
        expertise: toggle(current.personal.expertise, value),
      },
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

  const submit = useCallback(() => setSubmitted(true), []);

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
    bioRemaining,
    taglineRemaining,
    checklist,
    canContinue,
    isFirstStep: step === SignupStep.PersonalProfile,
    isLastStep: step === SignupStep.Review,
    goToStep,
    goNext,
    goBack,
    submit,
    setDocument,
    toggleContactPreference,
    toggleExpertise,
    toggleSupportArea,
    updatePersonal,
    updateStartup,
  };
}

export type SignupWizard = ReturnType<typeof useSignupWizard>;
