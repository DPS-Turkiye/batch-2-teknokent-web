import "server-only";

import type {
  MeetingProposal,
  ProposeMeetingInput,
} from "@/interfaces/meeting-proposal";
import { backendRequest } from "@/lib/server/backend-client";

const COORDINATOR_BASE = "/api/coordinator/meeting-proposals";
const BASE = "/api/meeting-proposals";

export function fetchCoordinatorMeetingProposals(
  actorId: string,
  filter: { programId: string | null; mentorshipId: string | null },
) {
  return backendRequest<MeetingProposal[]>({
    method: "GET",
    url: COORDINATOR_BASE,
    params: {
      actorId,
      ...(filter.programId ? { programId: filter.programId } : {}),
      ...(filter.mentorshipId ? { mentorshipId: filter.mentorshipId } : {}),
    },
  });
}

export function proposeMeeting(
  actorId: string,
  mentorshipId: string,
  input: ProposeMeetingInput,
) {
  return backendRequest<MeetingProposal>({
    method: "POST",
    url: `/api/coordinator/mentorships/${encodeURIComponent(mentorshipId)}/meeting-proposals`,
    data: { ...input, actorId },
  });
}

export function remindMeetingProposal(actorId: string, id: string) {
  return backendRequest<void>({
    method: "POST",
    url: `${COORDINATOR_BASE}/${encodeURIComponent(id)}/remind`,
    params: { actorId },
  });
}

export function withdrawMeetingProposal(actorId: string, id: string) {
  return backendRequest<void>({
    method: "DELETE",
    url: `${COORDINATOR_BASE}/${encodeURIComponent(id)}`,
    params: { actorId },
  });
}

export function fetchMyMeetingProposals(actorId: string) {
  return backendRequest<MeetingProposal[]>({
    method: "GET",
    url: BASE,
    params: { actorId },
  });
}

export function acceptMeetingProposal(actorId: string, id: string) {
  return backendRequest<MeetingProposal>({
    method: "POST",
    url: `${BASE}/${encodeURIComponent(id)}/accept`,
    params: { actorId },
  });
}

export function declineMeetingProposal(
  actorId: string,
  id: string,
  reason: string | null,
) {
  return backendRequest<MeetingProposal>({
    method: "POST",
    url: `${BASE}/${encodeURIComponent(id)}/decline`,
    data: { actorId, reason },
  });
}

export function proposeReschedule(
  actorId: string,
  meetingId: string,
  input: { scheduledAt: string; durationMinutes: number },
) {
  return backendRequest<MeetingProposal>({
    method: "POST",
    url: `/api/meetings/${encodeURIComponent(meetingId)}/reschedule-proposals`,
    data: { ...input, actorId },
  });
}
