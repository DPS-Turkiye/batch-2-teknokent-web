"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  CAPACITY_OPTIONS,
  CV_PARSE_MS,
  IntroPhase,
  MAX_EXPERTISE_AREAS,
  MENTOR_STEP_ORDER,
  MentorOnboardingStep,
  PLACEHOLDER_PARSED_PROFILE,
  type MentorOnboardingDraft,
  type ParsedProfile,
} from "@/interfaces/mentor-onboarding";
import { uploadDocument } from "@/lib/client/documents";
import { currentIdToken } from "@/lib/firebase/auth";

function emptyDraft(): MentorOnboardingDraft {
  return {
    cv: null,
    profile: { ...PLACEHOLDER_PARSED_PROFILE },
    expertise: [],
    supportTopics: [],
    programStages: [],
    mentoringStyles: [],
    workingStages: [],
    sectors: [],
    capacity: CAPACITY_OPTIONS[0],
  };
}

function toggle(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export function useMentorOnboarding() {
  const [step, setStep] = useState<MentorOnboardingStep>(
    MentorOnboardingStep.Intro,
  );
  const [phase, setPhase] = useState<IntroPhase>(IntroPhase.Upload);
  const [draft, setDraft] = useState<MentorOnboardingDraft>(emptyDraft);
  const [completed, setCompleted] = useState(false);
  const parseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (parseTimer.current) clearTimeout(parseTimer.current);
    },
    [],
  );

  const uploadCv = useCallback(
    (file: { name: string; size: number; file?: File }) => {
      setDraft((current) => ({ ...current, cv: file }));
      setPhase(IntroPhase.Parsing);
      const uploaded = file.file;
      if (!uploaded) {
        parseTimer.current = setTimeout(
          () => setPhase(IntroPhase.Review),
          CV_PARSE_MS,
        );
        return;
      }
      void (async () => {
        try {
          const idToken = await currentIdToken();
          if (!idToken) {
            throw new Error("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
          }
          await uploadDocument(uploaded, "cv", idToken);
          parseTimer.current = setTimeout(
            () => setPhase(IntroPhase.Review),
            CV_PARSE_MS,
          );
        } catch {
          setPhase(IntroPhase.Upload);
        }
      })();
    },
    [],
  );

  const enterManually = useCallback(() => {
    if (parseTimer.current) clearTimeout(parseTimer.current);
    setPhase(IntroPhase.Review);
  }, []);

  const restartUpload = useCallback(() => {
    if (parseTimer.current) clearTimeout(parseTimer.current);
    setDraft((current) => ({ ...current, cv: null }));
    setPhase(IntroPhase.Upload);
  }, []);

  const updateProfile = useCallback(
    <K extends keyof ParsedProfile>(key: K, value: ParsedProfile[K]) =>
      setDraft((current) => ({
        ...current,
        profile: { ...current.profile, [key]: value },
      })),
    [],
  );

  const toggleExpertise = useCallback((value: string) => {
    setDraft((current) => {
      const alreadyOn = current.expertise.includes(value);
      if (!alreadyOn && current.expertise.length >= MAX_EXPERTISE_AREAS) {
        return current;
      }
      return { ...current, expertise: toggle(current.expertise, value) };
    });
  }, []);

  const toggleSupportTopic = useCallback(
    (value: string) =>
      setDraft((current) => ({
        ...current,
        supportTopics: toggle(current.supportTopics, value),
      })),
    [],
  );

  const toggleProgramStage = useCallback(
    (value: string) =>
      setDraft((current) => ({
        ...current,
        programStages: toggle(current.programStages, value),
      })),
    [],
  );

  const toggleMentoringStyle = useCallback(
    (value: string) =>
      setDraft((current) => ({
        ...current,
        mentoringStyles: toggle(current.mentoringStyles, value),
      })),
    [],
  );

  const toggleWorkingStage = useCallback(
    (value: string) =>
      setDraft((current) => ({
        ...current,
        workingStages: toggle(current.workingStages, value),
      })),
    [],
  );

  const toggleSector = useCallback(
    (value: string) =>
      setDraft((current) => ({
        ...current,
        sectors: toggle(current.sectors, value),
      })),
    [],
  );

  const setCapacity = useCallback(
    (value: string) => setDraft((current) => ({ ...current, capacity: value })),
    [],
  );

  const goNext = useCallback(
    () =>
      setStep((current) => {
        const index = MENTOR_STEP_ORDER.indexOf(current);
        return MENTOR_STEP_ORDER[index + 1] ?? current;
      }),
    [],
  );

  const goBack = useCallback(
    () =>
      setStep((current) => {
        const index = MENTOR_STEP_ORDER.indexOf(current);
        return MENTOR_STEP_ORDER[index - 1] ?? current;
      }),
    [],
  );

  const complete = useCallback(() => setCompleted(true), []);

  const expertiseLimitReached = draft.expertise.length >= MAX_EXPERTISE_AREAS;

  const canContinue = useMemo(() => {
    if (step === MentorOnboardingStep.Intro) return phase === IntroPhase.Review;
    if (step === MentorOnboardingStep.Expertise)
      return draft.expertise.length > 0;
    if (step === MentorOnboardingStep.Compatibility)
      return draft.supportTopics.length > 0 && draft.programStages.length > 0;
    return draft.mentoringStyles.length > 0;
  }, [draft, phase, step]);

  return {
    step,
    phase,
    draft,
    completed,
    canContinue,
    expertiseLimitReached,
    isFirstStep: step === MentorOnboardingStep.Intro,
    isLastStep: step === MentorOnboardingStep.Preferences,
    uploadCv,
    enterManually,
    restartUpload,
    updateProfile,
    toggleExpertise,
    toggleSupportTopic,
    toggleProgramStage,
    toggleMentoringStyle,
    toggleWorkingStage,
    toggleSector,
    setCapacity,
    goNext,
    goBack,
    complete,
  };
}

export type MentorOnboarding = ReturnType<typeof useMentorOnboarding>;
