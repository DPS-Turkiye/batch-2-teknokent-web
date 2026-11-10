import type { ComponentProps } from "react";

import type { StatusChip } from "@/components/admin/admin-ui";
import { AppointmentSide } from "@/interfaces/appointment";
import { type BadgeAward, BadgeCode, BadgeStatus } from "@/interfaces/badges";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  PeerMentorGateState,
  type PeerTopicCategory,
} from "@/interfaces/peer-mentoring";

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
