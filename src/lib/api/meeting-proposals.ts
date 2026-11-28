import "server-only";

import type {
  MeetingProposal,
  ProposeMeetingInput,
} from "@/interfaces/meeting-proposal";
import { backendRequest } from "@/lib/server/backend-client";

const COORDINATOR_BASE = "/api/coordinator/meeting-proposals";

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
