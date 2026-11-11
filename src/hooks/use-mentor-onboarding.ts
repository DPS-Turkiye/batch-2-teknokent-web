"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useOnboardingDraftSync } from "@/hooks/use-onboarding-draft-sync";
import { clientText } from "@/i18n/client-texts";
import {
  MAX_EDUCATIONS,
  MeetingFrequency,
  type MentorEducationInput,
  type Weekday,
} from "@/interfaces/mentor";
import {
  EMPTY_STUDENT_DRAFT,
  emptyWeek,
  IntroPhase,
  MAX_EXPERIENCES,
  MAX_MENTOR_TOPICS,
  MAX_OFFERINGS,
  MENTOR_STEP_ORDER,
  MENTOR_TOPIC_OPTIONS,
  MentorOnboardingStep,
  PLACEHOLDER_PARSED_PROFILE,
  type MentorOnboardingDraft,
  type ParsedExperience,
  type ParsedProfile,
  type StudentOnboardingDraft,
  type WeeklySlot,
} from "@/interfaces/mentor-onboarding";
import type { OnboardingDraftRecord } from "@/interfaces/onboarding-draft";
import { ProfileAnalysisType } from "@/interfaces/profile-analysis";
import type { ProgramName } from "@/interfaces/program";
import { STARTUP_STAGE_OPTIONS, type UploadedFile } from "@/interfaces/signup";
import { DocumentKind } from "@/interfaces/startup-document";
import { uploadDocument } from "@/lib/client/documents";
import {
  updateAvailabilitySettings,
  updateMentorProfile,
} from "@/lib/client/mentor-profile";
import {
  chooseMentorPrograms,
  getMentorPrograms,
} from "@/lib/client/mentor-programs";
import { parseStoredCv } from "@/lib/client/profile-analysis";
import { getProgramNames } from "@/lib/client/programs";
import { getUserProfile, saveUserProfile } from "@/lib/client/user-profile";
import { dropDetachedFile } from "@/lib/draft-storage";
import { isOneOf } from "@/lib/enum";
import { currentIdToken, describeAuthError } from "@/lib/firebase/auth";
import { withKey, withKeys, withoutKeys, type Keyed } from "@/lib/keyed-list";
import {
  fillOnboardingProfile,
  fillStudies,
  toMentorCvResult,
} from "@/lib/mentor-cv";
import {
  invalidDays,
  openDays,
  toAvailabilityPayload,
  toMentorProfilePayload,
} from "@/lib/mentor-onboarding";
import {
  isStudentLevel,
  isStudentTopic,
  STUDENT_LEVELS,
  STUDENT_TOPICS,
} from "@/lib/student-topics";
import { scrollToTop, splitFullName } from "@/lib/utils";

const DRAFT_KIND = "mentor-onboarding" as const;

function emptyDraft(fullName = ""): MentorOnboardingDraft {
  return {
    ...splitFullName(fullName),
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
    student: { ...EMPTY_STUDENT_DRAFT },
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

/** A mentor in a program of individual students (İŞKUR) mentors students, so they get the student lists. */
function mentorsStudents(programs: ProgramName[] | null, programIds: string[]) {
  return (programs ?? []).some(
    (program) => program.individualMentees && programIds.includes(program.id),
  );
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
    if (!saved.payload || typeof saved.payload !== "object") return;
    const payload = saved.payload as Partial<MentorOnboardingDraft> & {
      introPhase?: IntroPhase;
    };
    const photo = dropDetachedFile(payload.photo ?? null);
    const cv = dropDetachedFile(payload.cv ?? null);
    setDraft((current) => {
      // A draft saved before a profile field existed still gets its default.
      const profile = { ...current.profile, ...payload.profile };
      return {
        ...current,
        ...payload,
        // Saved rows have no keys (and keys from another page load could collide), so each gets a fresh one.
        profile: {
          ...profile,
          history: withKeys(profile.history),
          education: withKeys(profile.education),
        },
        week: { ...current.week, ...payload.week },
        photo: photo.value,
        cv: cv.value,
        consent: false,
      };
    });
    // A CV that already reached the server is not lost, only its browser handle is.
    setDroppedFiles(photo.dropped + (payload.cvStoredName ? 0 : cv.dropped));
    setCvUploaded(Boolean(payload.cvStoredName));
    setPhase(
      payload.introPhase === IntroPhase.Review
        ? IntroPhase.Review
        : IntroPhase.Upload,
    );
    const nextStep = Number(saved.step);
    if (isOneOf(MENTOR_STEP_ORDER, nextStep)) setStep(nextStep);
  }, []);

  // The saved draft keeps its shape: the rows' React keys stay in the browser.
  const remotePayload = useMemo(
    () => ({
      ...draft,
      profile: {
        ...draft.profile,
        history: withoutKeys(draft.profile.history),
        education: withoutKeys(draft.profile.education),
      },
      introPhase: phase,
    }),
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
        const stored = await uploadDocument(
          file.file,
          DocumentKind.Cv,
          idToken,
        );
        setCvUploaded(true);
        setDraft((current) => ({ ...current, cvStoredName: file.name }));
        try {
          const cv = toMentorCvResult(
            await parseStoredCv(stored.id, ProfileAnalysisType.Mentor),
          );
          setDraft((current) => {
            const names =
              current.firstName.trim() || !cv.fullName
                ? {}
                : splitFullName(cv.fullName);
            return {
              ...current,
              ...names,
              about: current.about.trim() ? current.about : cv.about,
              profile: fillOnboardingProfile(current.profile, cv),
              student: fillStudies(current.student, cv.studies),
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
                withKey({
                  title: "",
                  organization: "",
                  period: "",
                  summary: "",
                }),
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
          // The editor hands back the role's fields; the row keeps its key.
          history: current.profile.history.map((role, i) =>
            i === index ? { ...value, key: role.key } : role,
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

  const updateEducations = useCallback(
    (
      change: (
        schools: Keyed<MentorEducationInput>[],
      ) => Keyed<MentorEducationInput>[],
    ) =>
      setDraft((current) => ({
        ...current,
        profile: {
          ...current.profile,
          education: change(current.profile.education),
        },
      })),
    [],
  );
  const addEducation = useCallback(
    () =>
      updateEducations((schools) =>
        schools.length >= MAX_EDUCATIONS
          ? schools
          : [...schools, withKey({ school: "", degree: "", period: "" })],
      ),
    [updateEducations],
  );
  const updateEducation = useCallback(
    (index: number, key: keyof MentorEducationInput, value: string) =>
      updateEducations((schools) =>
        schools.map((school, i) =>
          i === index ? { ...school, [key]: value } : school,
        ),
      ),
    [updateEducations],
  );
  const removeEducation = useCallback(
    (index: number) =>
      updateEducations((schools) => schools.filter((_, i) => i !== index)),
    [updateEducations],
  );

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

  // Moving between a student program and a startup program drops the choices the other list does not offer.
  const toggleProgram = useCallback(
    (programId: string) => {
      setDraft((current) => {
        const programIds = toggle(current.programIds, programId);
        const student = mentorsStudents(programs, programIds);
        if (student === mentorsStudents(programs, current.programIds)) {
          return { ...current, programIds };
        }
        return {
          ...current,
          programIds,
          topics: current.topics.filter(
            (topic) => isStudentTopic(topic) === student,
          ),
          stages: current.stages.filter(
            (stage) => isStudentLevel(stage) === student,
          ),
        };
      });
    },
    [programs],
  );

  const updateStudent = useCallback(
    <K extends keyof StudentOnboardingDraft>(
      key: K,
      value: StudentOnboardingDraft[K],
    ) =>
      setDraft((current) => ({
        ...current,
        student: { ...current.student, [key]: value },
      })),
    [],
  );

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
      await updateMentorProfile(
        toMentorProfilePayload(
          draft,
          mentorsStudents(programs, draft.programIds),
        ),
        idToken,
      );
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
        await uploadDocument(draft.photo.file, DocumentKind.Avatar, idToken);
      if (draft.cv?.file && !cvUploaded)
        await uploadDocument(draft.cv.file, DocumentKind.Cv, idToken);
      await clearRemote();
      setSubmittedAt(new Date());
    } catch (error) {
      setSaveError(describeAuthError(error));
    } finally {
      setIsSaving(false);
    }
  }, [clearRemote, cvUploaded, draft, programs]);

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
      const studentReady =
        !mentorsStudents(programs, draft.programIds) ||
        Boolean(draft.student.department.trim() && draft.student.studyYear);
      return (
        draft.topics.length > 0 &&
        draft.stages.length > 0 &&
        programChosen &&
        studentReady
      );
    }
    if (step === MentorOnboardingStep.Availability) {
      return (
        openDays(draft.week).length > 0 && invalidDays(draft.week).length === 0
      );
    }
    return draft.consent;
  }, [draft, phase, programs, step]);

  const studentMentor = mentorsStudents(programs, draft.programIds);

  const topicOptions = useMemo(
    () => [
      ...new Set(
        studentMentor
          ? [...STUDENT_TOPICS, ...draft.topics]
          : [
              ...MENTOR_TOPIC_OPTIONS,
              ...draft.profile.inferredAreas,
              ...draft.topics,
            ],
      ),
    ],
    [draft.profile.inferredAreas, draft.topics, studentMentor],
  );

  const stageOptions: readonly string[] = studentMentor
    ? STUDENT_LEVELS
    : STARTUP_STAGE_OPTIONS;

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
    stageOptions,
    studentMentor,
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
    updateStudent,
    addEducation,
    updateEducation,
    removeEducation,
    updateDay,
    goNext,
    goBack,
    goToStep,
    saveDraft,
    complete,
  };
}

export type MentorOnboarding = ReturnType<typeof useMentorOnboarding>;
