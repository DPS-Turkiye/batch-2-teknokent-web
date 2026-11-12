"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  useAppSession,
  useSession,
} from "@/components/providers/session-provider";
import { useMyBadges } from "@/hooks/use-badges";
import { useInstitutionRecord } from "@/hooks/use-institution-record";
import {
  MENTOR_AVAILABILITY_QUERY_KEY,
  MENTOR_AVAILABILITY_SETTINGS_QUERY_KEY,
  MENTOR_PROFILE_QUERY_KEY,
  useMentorAvailabilitySettings,
} from "@/hooks/use-mentor-profile";
import { usePeerExperienceCards } from "@/hooks/use-peer-experience-cards";
import {
  PEER_MENTOR_COUNTS_QUERY_KEY,
  PEER_MENTOR_QUERY_KEY,
  PEER_MENTORING_REQUESTS_QUERY_KEY,
  PEER_MENTORS_QUERY_KEY,
} from "@/hooks/use-peer-mentoring";
import { PEER_MENTOR_CATEGORIES_QUERY_KEY } from "@/hooks/use-student-profile-completion";
import { STUDENT_TRAINING_QUERY_KEY } from "@/hooks/use-student-training";
import { useWeeklyAvailabilityForm } from "@/hooks/use-weekly-availability-form";
import { BadgeStatus } from "@/interfaces/badges";
import type {
  MentorAvailabilitySettings,
  UpdateMentorAvailabilitySettingsPayload,
} from "@/interfaces/mentor";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  PeerExperienceKind,
  PeerMentorGateState,
  type PeerExperienceCard,
  type PeerMentorProfile,
  type PeerMentorProfileDraft,
  type PeerTopicCategory,
  type PeerTopicLevel,
  type PeerTopicLevels,
  type SavePeerMentorProfileInput,
} from "@/interfaces/peer-mentoring";
import { UserRole } from "@/interfaces/session";
import { ToastTone } from "@/interfaces/toast";
import { TrainingState } from "@/interfaces/training";
import {
  getAvailabilitySettings,
  updateAvailabilitySettings,
} from "@/lib/client/mentor-profile";
import { decideMentorRequest } from "@/lib/client/mentor-requests";
import {
  deletePeerMentorDraft,
  getPeerMentorDraft,
  getPeerMentorProfile,
  getReceivedPeerRequests,
  savePeerMentorDraft,
  savePeerMentorProfile,
} from "@/lib/client/peer-mentoring";
import { getPeerMentorCategories } from "@/lib/client/student-profile-completion";
import { getStudentTraining } from "@/lib/client/training";
import { withKeys, withoutKeys, type Keyed } from "@/lib/keyed-list";
import {
  chosenSubtopics,
  latestGateAward,
  levelsFor,
  PEER_ERASMUS_MAX,
  PEER_HELP_WITH_MAX,
  PEER_HELP_WITH_MIN,
  PEER_MENTOR_GIVE_HREF,
  PEER_MENTOR_TRAINING_HREF,
  PEER_PROFILE_TEXT_MAX,
  peerMentorCapacity,
  peerMentorGateState,
  subtopicGroupsWithCounts,
  weeklyHours,
} from "@/lib/peer-mentoring";
import { hasPermission } from "@/lib/permissions";
import {
  chosenCategories,
  toggleInterestSubtopic,
  toggleInterestTopic,
} from "@/lib/student-interests";
import { errorMessage, initials } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";
import { PeerGiveTab } from "@/types/iskur-student";

export const PEER_MENTOR_PROFILE_QUERY_KEY = [
  "peer-mentoring",
  "profile",
] as const;
export const PEER_MENTOR_DRAFT_QUERY_KEY = ["peer-mentoring", "draft"] as const;
export const RECEIVED_PEER_REQUESTS_QUERY_KEY = [
  "peer-mentoring",
  "received",
] as const;

/** Received requests still waiting for the mentor's answer. */
const WAITING = [
  MentorshipRequestStatus.Pending,
  MentorshipRequestStatus.MoreInfoRequested,
];

/** Where the student stands on the Mentorluk Ver side (see peerMentorGateState). */
export function usePeerMentorGate() {
  const { session, refresh } = useSession();
  const signedIn = Boolean(session);
  const badges = useMyBadges(signedIn);
  const institution = useInstitutionRecord(signedIn);
  const gateAward = latestGateAward(badges.data ?? []);
  const holdsMentor = hasPermission(session, UserRole.Mentor);
  const state = peerMentorGateState({
    holdsMentor,
    iskurParticipant: institution.data?.iskurParticipant ?? false,
    gateAward,
  });
  // A badge awarded after sign-in (the training passed, or a coordinator's award) isn't in the session yet: re-read
  // the account once, so the mentor side opens without signing in again.
  const sessionBehind = state === PeerMentorGateState.Earned && !holdsMentor;
  const refreshed = useRef(false);
  useEffect(() => {
    if (!sessionBehind || refreshed.current) return;
    refreshed.current = true;
    void refresh();
  }, [sessionBehind, refresh]);
  return {
    state,
    gateAward,
    expired: gateAward?.status === BadgeStatus.Expired,
    isLoading: badges.isLoading || institution.isLoading,
    sessionBehind,
  };
}

export type TrainingEntryReason = "loading" | "notAvailable" | "unavailable";

/**
 * "Eğitimi başlat" on Rozet Yok links to the training only while the student's program has a published training they
 * can take (VIDEO or QUIZ). Anything else keeps it disabled with a reason, including a backend without the training
 * endpoint (no retry, so that answer is immediate).
 */
export function usePeerMentorTrainingEntry(enabled = true): {
  href: string | null;
  reason: TrainingEntryReason | null;
} {
  const training = useQuery({
    queryKey: STUDENT_TRAINING_QUERY_KEY,
    queryFn: getStudentTraining,
    enabled,
    retry: false,
  });
  const state = training.data?.state;
  if (state === TrainingState.Video || state === TrainingState.Quiz) {
    return { href: PEER_MENTOR_TRAINING_HREF, reason: null };
  }
  if (training.isLoading) return { href: null, reason: "loading" };
  return {
    href: null,
    reason:
      state === TrainingState.NotAvailable ? "notAvailable" : "unavailable",
  };
}

export function usePeerMentorProfile(enabled = true) {
  return useQuery({
    queryKey: PEER_MENTOR_PROFILE_QUERY_KEY,
    queryFn: getPeerMentorProfile,
    enabled,
  });
}

/** Mentorluk Ver: requests waiting for an answer, and the accepted ones ("Mentee'lerim"). */
export function useReceivedPeerRequests(enabled = true) {
  const query = useQuery({
    queryKey: RECEIVED_PEER_REQUESTS_QUERY_KEY,
    queryFn: getReceivedPeerRequests,
    enabled,
  });
  const requests = query.data ?? [];
  return {
    query,
    waiting: requests.filter((request) => WAITING.includes(request.status)),
    mentees: requests.filter(
      (request) => request.status === MentorshipRequestStatus.Accepted,
    ),
  };
}

/** Kabul et / Uygun değil on a received request, with a short default message to the student. */
export function usePeerRequestDecision() {
  const t = useTranslations("odtuWorkspaces.student.peerMentoring.give");
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const decide = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      decideMentorRequest({
        id,
        status: accept
          ? MentorshipRequestStatus.Accepted
          : MentorshipRequestStatus.Declined,
        message: accept ? t("acceptMessage") : t("declineMessage"),
      }),
    onSuccess: (_, { accept }) => {
      void queryClient.invalidateQueries({
        queryKey: RECEIVED_PEER_REQUESTS_QUERY_KEY,
      });
      showToast({
        message: accept ? t("accepted") : t("declined"),
        tone: ToastTone.Success,
      });
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, t("decisionFailed")),
        tone: ToastTone.Error,
      }),
  });
  return {
    accept: (id: string) => decide.mutate({ id, accept: true }),
    decline: (id: string) => decide.mutate({ id, accept: false }),
    pendingId: decide.isPending ? decide.variables.id : undefined,
  };
}

/**
 * Mentorluk Ver once the profile is published: the open tab (requests first), the received requests, the decision
 * actions and the "Kapasiten" card's numbers.
 */
export function usePeerGivePublished(profileCapacity: number | null) {
  const [tab, setTab] = useState(PeerGiveTab.Requests);
  const received = useReceivedPeerRequests();
  const decision = usePeerRequestDecision();
  // The availability tab saves the capacity to the settings, not the profile; read it there so the card follows a save.
  const settings = useMentorAvailabilitySettings();
  const menteeCapacity =
    settings.data === undefined
      ? profileCapacity
      : settings.data.menteeCapacity;
  const loaded = received.query.data !== undefined;
  return {
    tab,
    setTab,
    received,
    decision,
    loaded,
    // Until the requests load the mentee count is unknown, so the card waits instead of showing 0.
    capacity: loaded
      ? peerMentorCapacity(received.mentees.length, menteeCapacity)
      : null,
  };
}

/** Who the wizard's preview card shows: the student, from the session and the institution record. */
export function usePeerMentorPreviewPerson() {
  const session = useAppSession();
  const institution = useInstitutionRecord();
  const gate = usePeerMentorGate();
  const fullName = session?.fullName ?? "";
  const department = institution.data?.departmentName ?? null;
  const classYear = institution.data?.classYear ?? null;
  return {
    fullName,
    initials: initials(fullName),
    department,
    classYear,
    showSeparator: department !== null && classYear !== null,
    badgeVerified: gate.state === PeerMentorGateState.Earned,
  };
}

export enum PeerMentorWizardStep {
  Categories,
  Subtopics,
  Experience,
  HelpWith,
  Links,
  Availability,
  Preview,
}

export const PEER_MENTOR_WIZARD_STEPS = Object.values(
  PeerMentorWizardStep,
).filter((value): value is PeerMentorWizardStep => typeof value === "number");

/** The wizard keeps topics and sub-topics under the names the shared interest helpers use. */
type WizardDraft = {
  topics: PeerTopicCategory[];
  subtopics: string[];
  strongCourses: string;
  projects: string;
  erasmus: string;
  helpWith: string;
  linkedinUrl: string;
  levels: PeerTopicLevels;
  experiences: Keyed<PeerExperienceCard>[];
};

const EMPTY_DRAFT: WizardDraft = {
  topics: [],
  subtopics: [],
  strongCourses: "",
  projects: "",
  erasmus: "",
  helpWith: "",
  linkedinUrl: "",
  levels: {},
  experiences: [],
};

/** A new peer mentor starts with no weekly hours, three mentees and 30-minute sessions. */
const DEFAULT_AVAILABILITY: MentorAvailabilitySettings = {
  rules: [],
  exceptions: [],
  menteeCapacity: 3,
  defaultMeetingDurationMinutes: 30,
  meetingBufferMinutes: 0,
};

const LINK = /^https?:\/\/\S+$/;

function lines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toDraft(profile: PeerMentorProfile): WizardDraft {
  return {
    topics: profile.categories,
    subtopics: profile.subTopics,
    strongCourses: profile.strongCourses.join("\n"),
    projects: profile.projects.join("\n"),
    erasmus: profile.erasmus ?? "",
    helpWith: profile.helpWith,
    linkedinUrl: profile.linkedinUrl ?? "",
    levels: profile.levels,
    experiences: withKeys(profile.experiences),
  };
}

export function toPeerMentorProfileInput(
  draft: WizardDraft,
): SavePeerMentorProfileInput {
  return {
    categories: draft.topics,
    subTopics: draft.subtopics,
    strongCourses: lines(draft.strongCourses),
    projects: lines(draft.projects),
    erasmus: draft.erasmus.trim(),
    helpWith: draft.helpWith.trim(),
    linkedinUrl: draft.linkedinUrl.trim(),
    levels: levelsFor(draft.levels, draft.topics),
    experiences: withoutKeys(draft.experiences),
  };
}

/** The step names a saved draft reopens on; a number would shift if a step were added. */
const STEP_NAME: Record<PeerMentorWizardStep, string> = {
  [PeerMentorWizardStep.Categories]: "categories",
  [PeerMentorWizardStep.Subtopics]: "subtopics",
  [PeerMentorWizardStep.Experience]: "experience",
  [PeerMentorWizardStep.HelpWith]: "helpWith",
  [PeerMentorWizardStep.Links]: "links",
  [PeerMentorWizardStep.Availability]: "availability",
  [PeerMentorWizardStep.Preview]: "preview",
};

function stepNamed(name: string | null): PeerMentorWizardStep | null {
  return (
    PEER_MENTOR_WIZARD_STEPS.find((step) => STEP_NAME[step] === name) ?? null
  );
}

/** What "Taslak olarak kaydet" sends: the answers so far and the step to reopen on. */
export function toProfileDraft(
  draft: WizardDraft,
  step: PeerMentorWizardStep,
): PeerMentorProfileDraft {
  return {
    step: STEP_NAME[step],
    categories: draft.topics,
    subTopics: draft.subtopics,
    strongCourses: lines(draft.strongCourses),
    projects: lines(draft.projects),
    erasmus: draft.erasmus,
    helpWith: draft.helpWith,
    linkedinUrl: draft.linkedinUrl,
    levels: levelsFor(draft.levels, draft.topics),
    experiences: withoutKeys(draft.experiences),
  };
}

/**
 * A saved draft back in the wizard; a card without a title is left out, and one without a start month comes back
 * to be completed, as an older published card does.
 */
function fromProfileDraft(saved: PeerMentorProfileDraft): WizardDraft {
  return {
    topics: saved.categories ?? [],
    subtopics: saved.subTopics ?? [],
    strongCourses: (saved.strongCourses ?? []).join("\n"),
    projects: (saved.projects ?? []).join("\n"),
    erasmus: saved.erasmus ?? "",
    helpWith: saved.helpWith ?? "",
    linkedinUrl: saved.linkedinUrl ?? "",
    levels: saved.levels ?? {},
    experiences: withKeys(
      (saved.experiences ?? []).flatMap((card) =>
        card.title
          ? [
              {
                kind: card.kind ?? PeerExperienceKind.Other,
                title: card.title,
                organization: card.organization,
                startedOn: card.startedOn ?? null,
                endedOn: card.endedOn,
                summary: card.summary,
              },
            ]
          : [],
      ),
    ),
  };
}

function toSettings(
  payload: UpdateMentorAvailabilitySettingsPayload,
): MentorAvailabilitySettings {
  return {
    ...payload,
    rules: payload.rules.map((rule, index) => ({
      ...rule,
      id: `draft-${index}`,
    })),
  };
}

/**
 * The peer-mentor profile wizard: categories → sub-topics → experience → "neye yardım edebilirim" → links → weekly
 * availability and capacity → preview → publish. Availability is a draft until publishing, because the mentor's
 * availability settings live on the profile row the publish creates; publishing saves the profile, then the hours.
 */
export function usePeerMentorWizard() {
  const t = useTranslations("iaIskur.wizard");
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const profile = usePeerMentorProfile();
  const existing = profile.data ?? null;
  const catalogue = useQuery({
    queryKey: PEER_MENTOR_CATEGORIES_QUERY_KEY,
    queryFn: getPeerMentorCategories,
  });
  const savedAvailability = useQuery({
    queryKey: MENTOR_AVAILABILITY_SETTINGS_QUERY_KEY,
    queryFn: getAvailabilitySettings,
    enabled: existing != null,
  });
  const savedDraft = useQuery({
    queryKey: PEER_MENTOR_DRAFT_QUERY_KEY,
    queryFn: getPeerMentorDraft,
  });
  const resumed = savedDraft.data ?? null;
  // A saved draft reopens on its own step until the student moves.
  const [chosenStep, setStep] = useState<PeerMentorWizardStep | null>(null);
  const step =
    chosenStep ??
    stepNamed(resumed?.draft.step ?? null) ??
    PeerMentorWizardStep.Categories;
  const [edits, setEdits] = useState<WizardDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availabilityDraft, setAvailabilityDraft] =
    useState<UpdateMentorAvailabilitySettingsPayload | null>(null);
  // Built once per loaded draft or profile, so the cards keep their row keys until the first edit takes over.
  const loaded = useMemo(
    () =>
      resumed
        ? fromProfileDraft(resumed.draft)
        : existing
          ? toDraft(existing)
          : EMPTY_DRAFT,
    [resumed, existing],
  );
  const draft = edits ?? loaded;
  const categories = catalogue.data ?? [];

  const availabilitySettings = useMemo(
    () =>
      availabilityDraft
        ? toSettings(availabilityDraft)
        : (savedAvailability.data ?? DEFAULT_AVAILABILITY),
    [availabilityDraft, savedAvailability.data],
  );
  const availability = useWeeklyAvailabilityForm(
    {
      settings: availabilitySettings,
      loadFailed: false,
      save: (payload) => {
        setAvailabilityDraft(payload);
        return Promise.resolve();
      },
      isSaving: false,
      numberFields: ["menteeCapacity", "defaultMeetingDurationMinutes"],
      quiet: true,
    },
    () => setStep(PeerMentorWizardStep.Preview),
  );

  const change = (update: (current: WizardDraft) => WizardDraft) => {
    setError(null);
    setEdits(update(draft));
  };
  const experienceCards = usePeerExperienceCards(draft.experiences, (next) =>
    change((current) => ({ ...current, experiences: next })),
  );

  const stepError = (current: PeerMentorWizardStep) => {
    if (
      current === PeerMentorWizardStep.Categories &&
      draft.topics.length === 0
    ) {
      return t("errors.categories");
    }
    // Moving on would drop the card being typed.
    if (
      current === PeerMentorWizardStep.Experience &&
      experienceCards.form !== null
    ) {
      return t("errors.experienceOpen");
    }
    // An older card has no start month, which the backend needs to publish it.
    if (
      current === PeerMentorWizardStep.Experience &&
      draft.experiences.some((card) => !card.startedOn)
    ) {
      return t("errors.experienceStart");
    }
    if (
      current === PeerMentorWizardStep.HelpWith &&
      draft.helpWith.trim().length < PEER_HELP_WITH_MIN
    ) {
      return t("errors.helpWith", { min: PEER_HELP_WITH_MIN });
    }
    if (
      current === PeerMentorWizardStep.Links &&
      draft.linkedinUrl.trim() &&
      !LINK.test(draft.linkedinUrl.trim())
    ) {
      return t("errors.link");
    }
    return null;
  };

  const publish = useMutation({
    mutationFn: async () => {
      const saved = await savePeerMentorProfile(
        toPeerMentorProfileInput(draft),
      );
      if (availabilityDraft)
        await updateAvailabilitySettings(availabilityDraft);
      return saved;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(PEER_MENTOR_PROFILE_QUERY_KEY, saved);
      // Publishing removes the draft on the backend.
      queryClient.setQueryData(PEER_MENTOR_DRAFT_QUERY_KEY, null);
      for (const queryKey of [
        MENTOR_AVAILABILITY_SETTINGS_QUERY_KEY,
        MENTOR_AVAILABILITY_QUERY_KEY,
        MENTOR_PROFILE_QUERY_KEY,
        PEER_MENTORS_QUERY_KEY,
        PEER_MENTOR_QUERY_KEY,
        PEER_MENTOR_COUNTS_QUERY_KEY,
        PEER_MENTORING_REQUESTS_QUERY_KEY,
      ]) {
        void queryClient.invalidateQueries({ queryKey });
      }
      showToast({ message: t("published"), tone: ToastTone.Success });
      router.push(PEER_MENTOR_GIVE_HREF);
    },
    onError: (publishError) =>
      setError(errorMessage(publishError, t("publishFailed"))),
  });

  /** One step forward or back, never past the first or the last. */
  const moveStep = (by: 1 | -1) => {
    const at = PEER_MENTOR_WIZARD_STEPS.indexOf(step);
    const last = PEER_MENTOR_WIZARD_STEPS.length - 1;
    setStep(
      PEER_MENTOR_WIZARD_STEPS[Math.min(last, Math.max(0, at + by))] ?? step,
    );
  };

  const saveDraft = useMutation({
    mutationFn: (current: PeerMentorProfileDraft) =>
      savePeerMentorDraft(current),
    onSuccess: (saved) => {
      queryClient.setQueryData(PEER_MENTOR_DRAFT_QUERY_KEY, saved);
      showToast({ message: t("draftSaved"), tone: ToastTone.Success });
    },
    onError: (saveError) =>
      setError(errorMessage(saveError, t("draftSaveFailed"))),
  });

  const discardDraft = useMutation({
    mutationFn: deletePeerMentorDraft,
    onSuccess: () => {
      queryClient.setQueryData(PEER_MENTOR_DRAFT_QUERY_KEY, null);
      setEdits(null);
      setAvailabilityDraft(null);
      experienceCards.cancel();
      setStep(PeerMentorWizardStep.Categories);
    },
    onError: (discardError) =>
      setError(errorMessage(discardError, t("draftSaveFailed"))),
  });

  return {
    step,
    draft,
    existing,
    error,
    isLoading: profile.isLoading || catalogue.isLoading || savedDraft.isLoading,
    // Without the saved draft, a save could overwrite it with an empty one.
    loadError: profile.error ?? catalogue.error ?? savedDraft.error,
    categories,
    categoryOptions: categories.map((item) => ({
      id: item.id,
      checked: draft.topics.includes(item.id),
    })),
    subtopicGroups: subtopicGroupsWithCounts(
      chosenCategories(categories, draft.topics),
      draft.subtopics,
    ),
    previewSubtopics: chosenSubtopics(categories, draft.subtopics),
    availability,
    availabilitySettings,
    weeklyHours: weeklyHours(availabilitySettings.rules),
    helpWithLength: draft.helpWith.trim().length,
    helpWithMin: PEER_HELP_WITH_MIN,
    helpWithMax: PEER_HELP_WITH_MAX,
    textMax: PEER_PROFILE_TEXT_MAX,
    erasmusMax: PEER_ERASMUS_MAX,
    previewHelpWith: draft.helpWith.trim(),
    previewLinkedin: draft.linkedinUrl.trim(),
    isFirst: step === PeerMentorWizardStep.Categories,
    isLast: step === PeerMentorWizardStep.Preview,
    toggleTopic: (id: PeerTopicCategory) =>
      change((current) => toggleInterestTopic(current, id, categories)),
    toggleSubtopic: (id: string) =>
      change((current) => toggleInterestSubtopic(current, id)),
    levelOf: (category: PeerTopicCategory) => draft.levels[category] ?? null,
    setLevel: (category: PeerTopicCategory, level: PeerTopicLevel) =>
      change((current) => ({
        ...current,
        levels: { ...current.levels, [category]: level },
      })),
    experienceCards,
    setField: (
      field: Exclude<
        keyof WizardDraft,
        "topics" | "subtopics" | "levels" | "experiences"
      >,
      value: string,
    ) => change((current) => ({ ...current, [field]: value })),
    next: () => {
      const problem = stepError(step);
      if (problem) {
        setError(problem);
        return;
      }
      setError(null);
      // The availability step moves on when the editor accepts its hours (it validates them first).
      if (step === PeerMentorWizardStep.Availability) {
        void availability.save();
        return;
      }
      moveStep(1);
    },
    back: () => {
      setError(null);
      moveStep(-1);
    },
    publish: () => publish.mutate(),
    isPublishing: publish.isPending,
    saveDraft: () => {
      // The open card isn't part of the draft yet; saving now would drop it without a word.
      if (experienceCards.form !== null) {
        setError(t("errors.experienceOpen"));
        return;
      }
      setError(null);
      saveDraft.mutate(toProfileDraft(draft, step));
    },
    isSavingDraft: saveDraft.isPending,
    /** When the draft was last saved; null without one. */
    draftSavedAt: resumed?.updatedAt ?? null,
    discardDraft: () => discardDraft.mutate(),
    isDiscardingDraft: discardDraft.isPending,
  };
}
