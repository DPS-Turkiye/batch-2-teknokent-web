import type { ComponentProps } from "react";

import type { StatusChip } from "@/components/admin/admin-ui";
import { AppointmentSide } from "@/interfaces/appointment";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";

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

/** `/student/peer-mentoring?as=MENTOR` opens Mentorluk Ver, so notifications can deep-link to it. */
export const PEER_MENTORING_SIDE_PARAM = "as";

export function peerMentoringSide(value: string | null): AppointmentSide {
  return value === AppointmentSide.Mentor
    ? AppointmentSide.Mentor
    : AppointmentSide.Mentee;
}

export const PEER_REQUEST_MESSAGE_MIN = 20;
export const PEER_REQUEST_MESSAGE_MAX = 1000;
