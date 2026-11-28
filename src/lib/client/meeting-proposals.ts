import type {
  MeetingProposal,
  ProposeMeetingInput,
} from "@/interfaces/meeting-proposal";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

const COORDINATOR_BASE = "/api/coordinator/meeting-proposals";
const BASE = "/api/meeting-proposals";

export async function getCoordinatorMeetingProposals(programId: string | null) {
  return requireSuccess(
    await backendHttp.get<MeetingProposal[]>(COORDINATOR_BASE, {
      params: programId ? { programId } : undefined,
    }),
  );
}

export async function getMentorshipMeetingProposals(mentorshipId: string) {
  return requireSuccess(
    await backendHttp.get<MeetingProposal[]>(COORDINATOR_BASE, {
      params: { mentorshipId },
    }),
  );
}

export async function proposeMeeting(
  mentorshipId: string,
  input: ProposeMeetingInput,
) {
  return requireSuccess(
    await backendHttp.post<MeetingProposal>(
      `/api/coordinator/mentorships/${encodeURIComponent(mentorshipId)}/meeting-proposals`,
      input,
    ),
  );
}

export async function remindMeetingProposal(id: string) {
  requireSuccess(
    await backendHttp.post(
      `${COORDINATOR_BASE}/${encodeURIComponent(id)}/remind`,
    ),
  );
}

export async function withdrawMeetingProposal(id: string) {
  requireSuccess(
    await backendHttp.delete(`${COORDINATOR_BASE}/${encodeURIComponent(id)}`),
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
