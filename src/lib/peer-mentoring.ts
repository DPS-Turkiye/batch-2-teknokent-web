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
  PeerMentorGateState,
  type PeerTopicCategory,
} from "@/interfaces/peer-mentoring";
import type { ProfileCompletionCategory } from "@/interfaces/student-profile-completion";
import { toTimeInput } from "@/lib/mentor-availability";
import { PeerCapacityNote } from "@/types/iskur-student";

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
