import type {
  MeetingProposal,
  ProposeMeetingInput,
} from "@/interfaces/meeting-proposal";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { httpClient } from "@/lib/http-client";

const COORDINATOR_BASE = "/api/coordinator/meeting-proposals";
// The coordinator's calls still go through this app's routes; the mentor's and the team's go to the backend.
const BASE = "/api/meeting-proposals";

export async function getCoordinatorMeetingProposals(programId: string | null) {
  return requireSuccess(
    await httpClient.get<MeetingProposal[]>(COORDINATOR_BASE, {
      params: programId ? { programId } : undefined,
    }),
  );
}

export async function getMentorshipMeetingProposals(mentorshipId: string) {
  return requireSuccess(
    await httpClient.get<MeetingProposal[]>(COORDINATOR_BASE, {
      params: { mentorshipId },
    }),
  );
}

export async function proposeMeeting(
  mentorshipId: string,
  input: ProposeMeetingInput,
) {
  return requireSuccess(
    await httpClient.post<MeetingProposal>(
      `/api/coordinator/mentorships/${encodeURIComponent(mentorshipId)}/meeting-proposals`,
      input,
    ),
  );
}

export async function remindMeetingProposal(id: string) {
  requireSuccess(
    await httpClient.post(
      `${COORDINATOR_BASE}/${encodeURIComponent(id)}/remind`,
    ),
  );
}

export async function withdrawMeetingProposal(id: string) {
  requireSuccess(
    await httpClient.delete(`${COORDINATOR_BASE}/${encodeURIComponent(id)}`),
  );
}

export async function getMyMeetingProposals() {
  return requireSuccess(await backendHttp.get<MeetingProposal[]>(BASE));
}

export async function acceptMeetingProposal(id: string) {
  return requireSuccess(
    await backendHttp.post<MeetingProposal>(
      `${BASE}/${encodeURIComponent(id)}/accept`,
    ),
  );
}

export async function declineMeetingProposal(id: string, reason: string) {
  return requireSuccess(
    await backendHttp.post<MeetingProposal>(
      `${BASE}/${encodeURIComponent(id)}/decline`,
      { reason: reason.trim() || null },
    ),
  );
}

export async function proposeReschedule(
  meetingId: string,
  input: { scheduledAt: string; durationMinutes: number },
) {
  return requireSuccess(
    await backendHttp.post<MeetingProposal>(
      `/api/meetings/${encodeURIComponent(meetingId)}/reschedule-proposals`,
      input,
    ),
  );
}
