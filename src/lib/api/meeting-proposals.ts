import "server-only";

import type { MeetingProposal } from "@/interfaces/meeting-proposal";
import { backendRequest } from "@/lib/server/backend-client";

const BASE = "/api/meeting-proposals";

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
