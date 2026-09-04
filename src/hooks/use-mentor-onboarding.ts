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
import type { UpdateMentorProfilePayload } from "@/interfaces/mentor";
import { useOnboardingDraftSync } from "@/hooks/use-onboarding-draft-sync";
import type { OnboardingDraftRecord } from "@/interfaces/onboarding-draft";
import { updateMentorProfile } from "@/lib/client/mentor-profile";
import { uploadDocument } from "@/lib/client/documents";
import { dropDetachedFile } from "@/lib/draft-storage";
import { currentIdToken, describeAuthError } from "@/lib/firebase/auth";

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

const DRAFT_KIND = "mentor-onboarding" as const;

function restoreFromPayload(saved: unknown): {
  draft: MentorOnboardingDraft;
  droppedFiles: number;
  phase: IntroPhase;
} {
  if (!saved || typeof saved !== "object") {
    return { draft: emptyDraft(), droppedFiles: 0, phase: IntroPhase.Upload };
  }
  const { introPhase, ...rest } = saved as MentorOnboardingDraft & {
    introPhase?: string;
  };
  const cv = dropDetachedFile(rest.cv ?? null);
  return {
    draft: { ...emptyDraft(), ...rest, cv: cv.value },
    droppedFiles: cv.dropped,
    phase: restorePhase(introPhase, cv.value),
  };
}

function restorePhase(
  introPhase: string | undefined,
  cv: MentorOnboardingDraft["cv"],
): IntroPhase {
  if (introPhase === IntroPhase.Review) return IntroPhase.Review;
  if (introPhase === IntroPhase.Upload) return IntroPhase.Upload;
  // Don't resume a fake "parsing" timer after a reload.
  if (introPhase === IntroPhase.Parsing) {
    return cv ? IntroPhase.Review : IntroPhase.Upload;
  }
  return IntroPhase.Upload;
}

function filled(value: string) {
  return value.trim().length > 0;
}

function orFallback(value: string, fallback: string) {
  return filled(value) ? value.trim() : fallback;
}

function hasIntroProfile(profile: ParsedProfile) {
  return (
    filled(profile.title) &&
    filled(profile.company) &&
    filled(profile.totalExperience)
  );
}

function toUpdatePayload(
  draft: MentorOnboardingDraft,
): UpdateMentorProfilePayload {
  const expertise = draft.expertise.join(", ");
  return {
    professionalTitle: orFallback(draft.profile.title, "Mentor"),
    company: orFallback(draft.profile.company, "Bağımsız"),
    availabilityLabel: "",
    responseTimeLabel: "",
    meetingMode: "",
    communicationPreference: "",
    mentoringStyle: draft.mentoringStyles.join(", "),
    fitLabel: "",
    experienceLevel: orFallback(
      draft.profile.totalExperience,
      expertise || "Mentor",
    ),
    sectorExperience: orFallback(
      draft.sectors.join(", "),
      expertise || "Genel",
    ),
    startupStages: orFallback(draft.workingStages.join(", "), "Belirtilmedi"),
    specialties: draft.expertise,
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
  const [droppedFiles, setDroppedFiles] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const parseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onRestore = useCallback((saved: OnboardingDraftRecord) => {
    const restored = restoreFromPayload(saved.payload);
    setDraft(restored.draft);
    setDroppedFiles(restored.droppedFiles);
    setPhase(restored.phase);
    const nextStep = Number(saved.step) as MentorOnboardingStep;
    if (MENTOR_STEP_ORDER.includes(nextStep)) setStep(nextStep);
  }, []);

  const remotePayload = useMemo(
    () => ({ ...draft, introPhase: phase }),
    [draft, phase],
  );
  const { clearRemote } = useOnboardingDraftSync({
    kind: DRAFT_KIND,
    step,
    payload: remotePayload,
    onRestore,
  });

  useEffect(
    () => () => {
      if (parseTimer.current) clearTimeout(parseTimer.current);
    },
    [],
  );

  const uploadCv = useCallback(
    (file: { name: string; size: number; file?: File }) => {
      setDraft((current) => ({ ...current, cv: file }));
      setUploadError("");
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
        } catch (error) {
          setUploadError(describeAuthError(error));
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

  // Onboarding runs before approval, so the token is forwarded explicitly —
  // there is no session cookie yet. The five presentation labels this flow does
  // not ask about are left empty for the mentor profile screen to fill in.
  const complete = useCallback(async () => {
    setSaveError("");
    setIsSaving(true);
    try {
      const idToken = await currentIdToken();
      if (!idToken) {
        throw new Error("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
      }
      const payload = toUpdatePayload(draft);
      await updateMentorProfile(payload, idToken);
      await clearRemote();
      setCompleted(true);
    } catch (error) {
      setSaveError(describeAuthError(error));
    } finally {
      setIsSaving(false);
    }
  }, [clearRemote, draft]);

  const expertiseLimitReached = draft.expertise.length >= MAX_EXPERTISE_AREAS;

  const canContinue = useMemo(() => {
    if (step === MentorOnboardingStep.Intro) {
      return phase === IntroPhase.Review && hasIntroProfile(draft.profile);
    }
    if (step === MentorOnboardingStep.Expertise)
      return draft.expertise.length > 0;
    if (step === MentorOnboardingStep.Compatibility)
      return draft.supportTopics.length > 0 && draft.programStages.length > 0;
    return (
      draft.mentoringStyles.length > 0 &&
      draft.workingStages.length > 0 &&
      draft.sectors.length > 0
    );
  }, [draft, phase, step]);

  return {
    step,
    phase,
    draft,
    completed,
    canContinue,
    isSaving,
    uploadError,
    saveError,
    droppedFiles,
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
