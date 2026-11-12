import type { ComponentProps } from "react";

import type { StatusChip } from "@/components/admin/admin-ui";
import { AppointmentSide } from "@/interfaces/appointment";
import { BadgeCode, BadgeStatus, type BadgeAward } from "@/interfaces/badges";
import {
  WEEKDAY_ORDER,
  type MentorAvailabilityRule,
  type Weekday,
} from "@/interfaces/mentor";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  PeerExperienceKind,
  PeerMentorGateState,
  type PeerExperienceCard,
  type PeerTopicCategory,
  type PeerTopicLevels,
} from "@/interfaces/peer-mentoring";
import type { ProfileCompletionCategory } from "@/interfaces/student-profile-completion";
import { toTimeInput } from "@/lib/mentor-availability";
import {
  ExperienceCardProblem,
  PeerCapacityNote,
  PeerRequestAvailability,
  type ExperienceCardForm,
} from "@/types/iskur-student";

type Tone = ComponentProps<typeof StatusChip>["tone"];

/** A request that is still waiting never shares Accepted's colour. */
export const PEER_REQUEST_STATUS_TONE: Record<MentorshipRequestStatus, Tone> = {
  [MentorshipRequestStatus.Pending]: "amber",
  [MentorshipRequestStatus.MoreInfoRequested]: "blue",
  [MentorshipRequestStatus.CounterProposed]: "blue",
  [MentorshipRequestStatus.Accepted]: "green",
  [MentorshipRequestStatus.Declined]: "red",
  [MentorshipRequestStatus.Withdrawn]: "neutral",
};

/** A mentee may not send a second request to a mentor while one is still open. */
export const OPEN_PEER_REQUEST_STATUSES: readonly MentorshipRequestStatus[] = [
  MentorshipRequestStatus.Pending,
  MentorshipRequestStatus.MoreInfoRequested,
  MentorshipRequestStatus.CounterProposed,
];

/** Lane I's Akran Mentoru training (video + quiz); passing it awards the badge. */
export const PEER_MENTOR_TRAINING_HREF = "/student/peer-mentoring/training";

/** `/student/peer-mentoring?as=MENTOR` opens Mentorluk Ver, so notifications can deep-link to it. */
export const PEER_MENTORING_SIDE_PARAM = "as";

export function peerMentoringSide(value: string | null): AppointmentSide {
  return value === AppointmentSide.Mentor
    ? AppointmentSide.Mentor
    : AppointmentSide.Mentee;
}

export const PEER_REQUEST_MESSAGE_MIN = 20;
export const PEER_REQUEST_MESSAGE_MAX = 1000;

/**
 * The Mentorluk Ver side a student sees. The badge is the source of truth (MENTOR in a session cookie can lag behind
 * an award until the next sign-in check). D4 seam: a revoked or expired Akran Mentoru badge takes MENTOR away, and
 * today that also closes the mentor side for requests and mentorships the student already has; when D4 is decided,
 * this is the one rule to change (with PeerMentoringService.requirePeerMentor on the backend).
 */
export function peerMentorGateState({
  holdsMentor,
  iskurParticipant,
  gateAward,
}: {
  holdsMentor: boolean;
  iskurParticipant: boolean;
  gateAward: Pick<BadgeAward, "status"> | null;
}): PeerMentorGateState {
  if (holdsMentor || gateAward?.status === BadgeStatus.Active) {
    return PeerMentorGateState.Earned;
  }
  if (gateAward) return PeerMentorGateState.Revoked;
  if (iskurParticipant) return PeerMentorGateState.NoBadge;
  return PeerMentorGateState.Hidden;
}

/** The newest Akran Mentoru award among the student's badges, whatever its status. */
export function latestGateAward<
  T extends Pick<BadgeAward, "code" | "awardedAt">,
>(awards: readonly T[]): T | null {
  return (
    [...awards]
      .filter((award) => award.code === BadgeCode.PeerMentor)
      .sort((left, right) =>
        right.awardedAt.localeCompare(left.awardedAt),
      )[0] ?? null
  );
}

/** The mentor's categories the student also picked as interests, in the mentor's order ("Neden önerildi?"). */
export function sharedInterests(
  mentorCategories: readonly PeerTopicCategory[],
  interests: readonly PeerTopicCategory[],
) {
  return mentorCategories.filter((category) => interests.includes(category));
}

export type PeerMentorCapacity = {
  used: number;
  capacity: number | null;
  /** `used` held at the capacity, for the bar (a lowered capacity can leave more mentees than places). */
  filled: number;
  /** Bar fill, 0–100; only a full capacity shows 100. */
  percent: number;
  note: PeerCapacityNote;
};

/**
 * The "Kapasiten" card: accepted mentees against the mentor's capacity. No capacity (null, or a non-positive value the
 * backend should never send) means no limit.
 */
export function peerMentorCapacity(
  mentees: number,
  capacity: number | null,
): PeerMentorCapacity {
  if (capacity === null || capacity <= 0) {
    return {
      used: mentees,
      capacity: null,
      filled: mentees,
      percent: 0,
      note: PeerCapacityNote.Unset,
    };
  }
  const filled = Math.min(mentees, capacity);
  const note =
    mentees >= capacity
      ? PeerCapacityNote.Full
      : mentees + 1 === capacity
        ? PeerCapacityNote.LastPlace
        : PeerCapacityNote.Open;
  return {
    used: mentees,
    capacity,
    filled,
    percent: Math.floor((filled / capacity) * 100),
    note,
  };
}

/** The backend's limits on the peer-mentor profile's texts. */
export const PEER_HELP_WITH_MIN = 20;
export const PEER_HELP_WITH_MAX = 2000;
export const PEER_PROFILE_TEXT_MAX = 2000;
export const PEER_ERASMUS_MAX = 500;

export type WeeklyHours = { dayOfWeek: Weekday; start: string; end: string };

/** The weekly ranges in week order, earliest first within a day, as HH:mm ("Salı 18:00 – 20:00" in the preview). */
export function weeklyHours(
  rules: readonly Pick<
    MentorAvailabilityRule,
    "dayOfWeek" | "startTime" | "endTime"
  >[],
): WeeklyHours[] {
  return rules
    .map((rule) => ({
      dayOfWeek: rule.dayOfWeek,
      start: toTimeInput(rule.startTime),
      end: toTimeInput(rule.endTime),
    }))
    .sort(
      (left, right) =>
        WEEKDAY_ORDER.indexOf(left.dayOfWeek) -
          WEEKDAY_ORDER.indexOf(right.dayOfWeek) ||
        left.start.localeCompare(right.start),
    );
}

type Subtopic = ProfileCompletionCategory["subtopics"][number];

/** Each chosen category with its sub-topics marked as picked, and how many are ("3 alt konu seçildi"). */
export function subtopicGroupsWithCounts(
  groups: readonly ProfileCompletionCategory[],
  selected: readonly string[],
) {
  return groups.map((group) => {
    const subtopics = group.subtopics.map((sub) => ({
      ...sub,
      checked: selected.includes(sub.id),
    }));
    return {
      id: group.id,
      subtopics,
      selectedCount: subtopics.filter((sub) => sub.checked).length,
    };
  });
}

/** The picked sub-topics in catalogue order, with their labels' keys; ids the catalogue no longer has are left out. */
export function chosenSubtopics(
  catalogue: readonly ProfileCompletionCategory[],
  selected: readonly string[],
): Subtopic[] {
  return catalogue.flatMap((group) =>
    group.subtopics.filter((sub) => selected.includes(sub.id)),
  );
}

/** How many mentors "Sana önerilenler" shows. */
export const RECOMMENDED_PEER_MENTOR_COUNT = 3;

/**
 * Keşfet: the first mentors with a "Neden önerildi?" reason (the backend already ranks them) are recommended; everyone
 * else is listed under "Mentor ara". While the student filters, everything is a search result.
 */
export function splitRecommended<T extends { mentorId: string }>(
  mentors: readonly T[],
  hasReason: (mentor: T) => boolean,
  filtered: boolean,
): { recommended: T[]; others: T[] } {
  if (filtered) return { recommended: [], others: [...mentors] };
  const recommended = mentors
    .filter(hasReason)
    .slice(0, RECOMMENDED_PEER_MENTOR_COUNT);
  const picked = new Set(recommended.map((mentor) => mentor.mentorId));
  return {
    recommended,
    others: mentors.filter((mentor) => !picked.has(mentor.mentorId)),
  };
}

/** A request that ended without a mentorship; Mentorluklarım offers "Başka Mentor Bul" on it. */
export const CLOSED_PEER_REQUEST_STATUSES: readonly MentorshipRequestStatus[] =
  [MentorshipRequestStatus.Declined, MentorshipRequestStatus.Withdrawn];

/** Mentorluklarım: accepted requests are the active mentorships; the rest are "Taleplerim". */
export function splitPeerRequests<
  T extends { status: MentorshipRequestStatus },
>(requests: readonly T[]): { active: T[]; others: T[] } {
  return {
    active: requests.filter(
      (request) => request.status === MentorshipRequestStatus.Accepted,
    ),
    others: requests.filter(
      (request) => request.status !== MentorshipRequestStatus.Accepted,
    ),
  };
}

/** An open request comes first: the student already asked this mentor, full or not. */
export function peerRequestAvailability(
  hasOpenRequest: boolean,
  capacityFull: boolean,
): PeerRequestAvailability {
  if (hasOpenRequest) return PeerRequestAvailability.Requested;
  if (capacityFull) return PeerRequestAvailability.Full;
  return PeerRequestAvailability.Open;
}

/** A peer mentor's profile page on the Mentorluk Al side. */
export function peerMentorProfileHref(mentorId: string) {
  return `/student/peer-mentoring/mentors/${encodeURIComponent(mentorId)}`;
}

type CatalogueSubTopic = ProfileCompletionCategory["subtopics"][number];

/** The sub-topics a filter can offer: the chosen category's, or every listed category's, each once. */
export function subTopicOptions(
  catalogue: readonly ProfileCompletionCategory[],
  category: PeerTopicCategory | null,
): CatalogueSubTopic[] {
  const seen = new Set<string>();
  return catalogue
    .filter((item) => category === null || item.id === category)
    .flatMap((item) => item.subtopics)
    .filter((sub) => {
      if (seen.has(sub.id)) return false;
      seen.add(sub.id);
      return true;
    });
}

/** Each sub-topic id the mentor offers, with its catalogue entry when there is one (older free text has none). */
export function offeredSubTopics(
  catalogue: readonly ProfileCompletionCategory[],
  ids: readonly string[],
): { id: string; entry: CatalogueSubTopic | null }[] {
  const byId = new Map(
    catalogue.flatMap((item) => item.subtopics).map((sub) => [sub.id, sub]),
  );
  return ids.map((id) => ({ id, entry: byId.get(id) ?? null }));
}

const MONTH_KEYS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

export type MonthKey = (typeof MONTH_KEYS)[number];

/** The day and month a mentorship began, for "3 Kasım'dan beri": Turkish picks the suffix by month. */
export function mentorshipSince(acceptedAt: string): {
  day: number;
  month: MonthKey;
} {
  const date = new Date(acceptedAt);
  return { day: date.getDate(), month: MONTH_KEYS[date.getMonth()] ?? "jan" };
}

/** The backend's limits on an experience card. */
export const PEER_EXPERIENCE_CARDS_MAX = 10;
export const PEER_EXPERIENCE_TITLE_MAX = 200;
export const PEER_EXPERIENCE_SUMMARY_MAX = 300;

export const EMPTY_EXPERIENCE_FORM: ExperienceCardForm = {
  title: "",
  organization: "",
  startedOn: "",
  endedOn: "",
  summary: "",
};

/** The first thing stopping the card from being saved; the design asks for a title, an organisation and a start. */
export function experienceCardProblem(
  form: ExperienceCardForm,
): ExperienceCardProblem | null {
  if (!form.title.trim()) return ExperienceCardProblem.Title;
  if (!form.organization.trim()) return ExperienceCardProblem.Organization;
  if (!form.startedOn) return ExperienceCardProblem.Start;
  // "yyyy-MM" strings compare in date order.
  if (form.endedOn && form.endedOn < form.startedOn) {
    return ExperienceCardProblem.EndBeforeStart;
  }
  return null;
}

export function toExperienceCard(form: ExperienceCardForm): PeerExperienceCard {
  return {
    kind: PeerExperienceKind.Other,
    title: form.title.trim(),
    organization: form.organization.trim() || null,
    startedOn: form.startedOn,
    endedOn: form.endedOn || null,
    summary: form.summary.trim() || null,
  };
}

export function toExperienceForm(card: PeerExperienceCard): ExperienceCardForm {
  return {
    title: card.title,
    organization: card.organization ?? "",
    startedOn: card.startedOn,
    endedOn: card.endedOn ?? "",
    summary: card.summary ?? "",
  };
}

/** "Temmuz 2025" from "2025-07", read the same in every time zone. */
export function formatYearMonth(value: string, locale: string) {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

/** The chosen categories' levels only: a level outlives neither its category nor a deselection. */
export function levelsFor(
  levels: PeerTopicLevels,
  chosen: readonly PeerTopicCategory[],
): PeerTopicLevels {
  return Object.fromEntries(
    chosen.flatMap((category) => {
      const level = levels[category];
      return level ? [[category, level]] : [];
    }),
  );
}
