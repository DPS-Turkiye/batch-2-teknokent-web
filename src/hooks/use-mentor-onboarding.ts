"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useOnboardingDraftSync } from "@/hooks/use-onboarding-draft-sync";
import { clientText } from "@/i18n/client-texts";
import { MeetingFrequency, Weekday } from "@/interfaces/mentor";
import {
  IntroPhase,
  MAX_EXPERIENCES,
  MAX_MENTOR_TOPICS,
  MAX_OFFERINGS,
  MENTOR_STEP_ORDER,
  MENTOR_TOPIC_OPTIONS,
  MentorOnboardingStep,
  PLACEHOLDER_PARSED_PROFILE,
  emptyWeek,
  type MentorOnboardingDraft,
  type ParsedExperience,
  type ParsedProfile,
  type WeeklySlot,
} from "@/interfaces/mentor-onboarding";
import type { OnboardingDraftRecord } from "@/interfaces/onboarding-draft";
import type { ProgramName } from "@/interfaces/program";
import type { UploadedFile } from "@/interfaces/signup";
import { uploadDocument } from "@/lib/client/documents";
import {
  chooseMentorPrograms,
  getMentorPrograms,
} from "@/lib/client/mentor-programs";
import { getProgramNames } from "@/lib/client/programs";
import {
  updateAvailabilitySettings,
  updateMentorProfile,
} from "@/lib/client/mentor-profile";
import { parseStoredCv } from "@/lib/client/profile-analysis";
import { getUserProfile, saveUserProfile } from "@/lib/client/user-profile";
import { dropDetachedFile } from "@/lib/draft-storage";
import { currentIdToken, describeAuthError } from "@/lib/firebase/auth";
import { fillOnboardingProfile, toMentorCvResult } from "@/lib/mentor-cv";
import {
  invalidDays,
  openDays,
  toAvailabilityPayload,
  toMentorProfilePayload,
} from "@/lib/mentor-onboarding";
import { scrollToTop } from "@/lib/utils";

const DRAFT_KIND = "mentor-onboarding" as const;

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { firstName: parts[0] ?? "", lastName: "" };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) ?? "",
  };
}

function emptyDraft(fullName = ""): MentorOnboardingDraft {
  return {
    ...splitName(fullName),
    linkedin: "",
    about: "",
    photo: null,
    cv: null,
    cvStoredName: null,
    profile: { ...PLACEHOLDER_PARSED_PROFILE },
    programIds: [],
    topics: [],
    stages: [],
    offerings: [],
    week: emptyWeek(),
    capacity: 3,
    durationMinutes: 45,
    bufferMinutes: 15,
    frequency: MeetingFrequency.Biweekly,
    format: "Online",
    responseTime: "1–2 gün",
    consent: false,
  };
}

function toggle<T>(list: T[], value: T) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

async function requireToken() {
  const idToken = await currentIdToken();
  if (!idToken) throw new Error(clientText("sessionExpired"));
  return idToken;
}

export function useMentorOnboarding(
  account: { fullName: string } = { fullName: "" },
) {
  const t = useTranslations("mentorOnboarding");
  const [step, setStep] = useState<MentorOnboardingStep>(
    MentorOnboardingStep.Profile,
  );
  const [phase, setPhase] = useState<IntroPhase>(IntroPhase.Upload);
  const [draft, setDraft] = useState<MentorOnboardingDraft>(() =>
    emptyDraft(account.fullName),
  );
  const [cvUploaded, setCvUploaded] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState(0);
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [parseNote, setParseNote] = useState("");
  const [saveError, setSaveError] = useState("");
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [editingExperience, setEditingExperience] = useState<number | null>(
    null,
  );
  const [programs, setPrograms] = useState<ProgramName[] | null>(null);

  // Programs the mentor already has (an invite link, an earlier visit) start ticked.
  useEffect(() => {
    let cancelled = false;
    getProgramNames()
      .then((names) => {
        if (!cancelled) setPrograms(names);
      })
      .catch(() => {
        if (!cancelled) setPrograms([]);
      });
    currentIdToken()
      .then((idToken) => (idToken ? getMentorPrograms(idToken) : []))
      .then((chosen) => {
        if (cancelled || !chosen.length) return;
        setDraft((current) => ({
          ...current,
          programIds: [...new Set([...current.programIds, ...chosen])],
        }));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const onRestore = useCallback((saved: OnboardingDraftRecord) => {
    const payload = saved.payload as Partial<MentorOnboardingDraft> & {
      introPhase?: IntroPhase;
    };
    if (!payload || typeof payload !== "object") return;
    const photo = dropDetachedFile(payload.photo ?? null);
    const cv = dropDetachedFile(payload.cv ?? null);
    setDraft((current) => ({
      ...current,
      ...payload,
      week: { ...current.week, ...payload.week },
      photo: photo.value,
      cv: cv.value,
      consent: false,
    }));
    // A CV that already reached the server is not lost, only its browser handle is.
    setDroppedFiles(photo.dropped + (payload.cvStoredName ? 0 : cv.dropped));
    setCvUploaded(Boolean(payload.cvStoredName));
    setPhase(
      payload.introPhase === IntroPhase.Review
        ? IntroPhase.Review
        : IntroPhase.Upload,
    );
    const nextStep = Number(saved.step) as MentorOnboardingStep;
    if (MENTOR_STEP_ORDER.includes(nextStep)) setStep(nextStep);
  }, []);

  const remotePayload = useMemo(
    () => ({ ...draft, introPhase: phase }),
    [draft, phase],
  );
  const { saveNow, clearRemote } = useOnboardingDraftSync({
    kind: DRAFT_KIND,
    step,
    payload: remotePayload,
    onRestore,
  });

  useEffect(() => {
    scrollToTop();
  }, [step, phase]);

  const update = useCallback(
    <K extends keyof MentorOnboardingDraft>(
      key: K,
      value: MentorOnboardingDraft[K],
    ) => setDraft((current) => ({ ...current, [key]: value })),
    [],
  );

  const updateProfile = useCallback(
    <K extends keyof ParsedProfile>(key: K, value: ParsedProfile[K]) =>
      setDraft((current) => ({
        ...current,
        profile: { ...current.profile, [key]: value },
      })),
    [],
  );

  const uploadCv = useCallback(
    async (file: UploadedFile) => {
      setDraft((current) => ({ ...current, cv: file }));
      setUploadError("");
      setParseNote("");
      if (!file.file) {
        setPhase(IntroPhase.Review);
        return;
      }
      setPhase(IntroPhase.Parsing);
      try {
        const idToken = await requireToken();
        const stored = await uploadDocument(file.file, "cv", idToken);
        setCvUploaded(true);
        setDraft((current) => ({ ...current, cvStoredName: file.name }));
        try {
          const cv = toMentorCvResult(await parseStoredCv(stored.id, "mentor"));
          setDraft((current) => {
            const names =
              current.firstName.trim() || !cv.fullName
                ? {}
                : splitName(cv.fullName);
            return {
              ...current,
              ...names,
              about: current.about.trim() ? current.about : cv.about,
              profile: fillOnboardingProfile(current.profile, cv),
            };
          });
        } catch {
          setParseNote(t("cvUnreadable"));
        }
        setPhase(IntroPhase.Review);
      } catch (error) {
        setUploadError(describeAuthError(error));
        setPhase(IntroPhase.Upload);
      }
    },
    [t],
  );

  const enterManually = useCallback(() => setPhase(IntroPhase.Review), []);

  const setCv = useCallback((file: UploadedFile | null) => {
    setDraft((current) => ({ ...current, cv: file, cvStoredName: null }));
    setCvUploaded(false);
  }, []);

  const addExperience = useCallback(() => {
    setEditingExperience(draft.profile.history.length);
    setDraft((current) =>
      current.profile.history.length >= MAX_EXPERIENCES
        ? current
        : {
            ...current,
            profile: {
              ...current.profile,
              history: [
                ...current.profile.history,
                { title: "", organization: "", period: "", summary: "" },
              ],
            },
          },
    );
  }, [draft.profile.history.length]);

  const updateExperience = useCallback(
    (index: number, value: ParsedExperience) =>
      setDraft((current) => ({
        ...current,
        profile: {
          ...current.profile,
          history: current.profile.history.map((role, i) =>
            i === index ? value : role,
          ),
        },
      })),
    [],
  );

  const removeExperience = useCallback((index: number) => {
    setEditingExperience(null);
    setDraft((current) => ({
      ...current,
      profile: {
        ...current.profile,
        history: current.profile.history.filter((_, i) => i !== index),
      },
    }));
  }, []);

  const toggleTopic = useCallback((topic: string) => {
    setDraft((current) => {
      if (
        !current.topics.includes(topic) &&
        current.topics.length >= MAX_MENTOR_TOPICS
      ) {
        return current;
      }
      return { ...current, topics: toggle(current.topics, topic) };
    });
  }, []);

  const toggleStage = useCallback(
    (stage: string) =>
      setDraft((current) => ({
        ...current,
        stages: toggle(current.stages, stage),
      })),
    [],
  );

  const toggleProgram = useCallback((programId: string) => {
    setDraft((current) => ({
      ...current,
      programIds: toggle(current.programIds, programId),
    }));
  }, []);

  const addOffering = useCallback((text: string) => {
    const value = text.trim();
    if (!value) return;
    setDraft((current) =>
      current.offerings.length >= MAX_OFFERINGS ||
      current.offerings.includes(value)
        ? current
        : { ...current, offerings: [...current.offerings, value] },
    );
  }, []);

  const removeOffering = useCallback(
    (index: number) =>
      setDraft((current) => ({
        ...current,
        offerings: current.offerings.filter((_, i) => i !== index),
      })),
    [],
  );

  const updateDay = useCallback(
    (day: Weekday, value: Partial<WeeklySlot>) =>
      setDraft((current) => ({
        ...current,
        week: { ...current.week, [day]: { ...current.week[day], ...value } },
      })),
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

  const goBack = useCallback(() => {
    if (step === MentorOnboardingStep.Profile && phase === IntroPhase.Review) {
      setPhase(IntroPhase.Upload);
      return;
    }
    setStep((current) => {
      const index = MENTOR_STEP_ORDER.indexOf(current);
      return MENTOR_STEP_ORDER[index - 1] ?? current;
    });
  }, [phase, step]);

  const goToStep = useCallback(
    (next: MentorOnboardingStep) => setStep(next),
    [],
  );

  const saveDraft = useCallback(async () => {
    await saveNow();
    setDraftSavedAt(Date.now());
  }, [saveNow]);

  // Onboarding runs before approval, so every call carries the token; there is no session yet.
  const complete = useCallback(async () => {
    setSaveError("");
    setIsSaving(true);
    try {
      const idToken = await requireToken();
      await updateMentorProfile(toMentorProfilePayload(draft), idToken);
      await updateAvailabilitySettings(toAvailabilityPayload(draft), idToken);
      await chooseMentorPrograms(draft.programIds, idToken);
      const current = await getUserProfile(idToken);
      await saveUserProfile(
        {
          fullName:
            `${draft.firstName} ${draft.lastName}`.trim() || current.fullName,
          jobTitle: draft.profile.title.trim() || current.jobTitle,
          phone: current.phone,
          bio: current.bio,
          linkedinUrl: draft.linkedin.trim() || null,
          expertise: current.expertise,
        },
        idToken,
      );
      if (draft.photo?.file)
        await uploadDocument(draft.photo.file, "avatar", idToken);
      if (draft.cv?.file && !cvUploaded)
        await uploadDocument(draft.cv.file, "cv", idToken);
      await clearRemote();
      setSubmittedAt(new Date());
    } catch (error) {
      setSaveError(describeAuthError(error));
    } finally {
      setIsSaving(false);
    }
  }, [clearRemote, cvUploaded, draft]);

  const canContinue = useMemo(() => {
    if (step === MentorOnboardingStep.Profile) {
      return (
        phase === IntroPhase.Review &&
        Boolean(
          draft.firstName.trim() &&
          draft.lastName.trim() &&
          draft.profile.title.trim() &&
          draft.profile.totalExperience.trim(),
        )
      );
    }
    if (step === MentorOnboardingStep.Areas) {
      const programChosen = !programs?.length || draft.programIds.length > 0;
      return (
        draft.topics.length > 0 && draft.stages.length > 0 && programChosen
      );
    }
    if (step === MentorOnboardingStep.Availability) {
      return (
        openDays(draft.week).length > 0 && invalidDays(draft.week).length === 0
      );
    }
    return draft.consent;
  }, [draft, phase, programs, step]);

  const topicOptions = useMemo(
    () => [
      ...new Set([
        ...MENTOR_TOPIC_OPTIONS,
        ...draft.profile.inferredAreas,
        ...draft.topics,
      ]),
    ],
    [draft.profile.inferredAreas, draft.topics],
  );

  return {
    step,
    phase,
    draft,
    submittedAt,
    isSaving,
    uploadError,
    parseNote,
    saveError,
    draftSavedAt,
    droppedFiles,
    canContinue,
    topicOptions,
    programs: programs ?? [],
    programsLoading: programs === null,
    topicLimitReached: draft.topics.length >= MAX_MENTOR_TOPICS,
    invalidDays: invalidDays(draft.week),
    isFirstScreen:
      step === MentorOnboardingStep.Profile && phase === IntroPhase.Upload,
    isLastStep: step === MentorOnboardingStep.Review,
    update,
    updateProfile,
    uploadCv,
    enterManually,
    setCv,
    addExperience,
    editingExperience,
    setEditingExperience,
    updateExperience,
    removeExperience,
    toggleTopic,
    toggleStage,
    toggleProgram,
    addOffering,
    removeOffering,
    updateDay,
    goNext,
    goBack,
    goToStep,
    saveDraft,
    complete,
  };
}

export type MentorOnboarding = ReturnType<typeof useMentorOnboarding>;
