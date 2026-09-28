import type { MeetingItem, MeetingStatus } from "@/interfaces/meeting";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";
import { announceDroppedTranscriptBot } from "@/lib/transcript-bot";

export async function getMeetings() {
  return requireSuccess(await httpClient.get<MeetingItem[]>("/api/meetings"));
}

export async function postMeeting(payload: Record<string, unknown>) {
  return announceDroppedTranscriptBot(
    payload.transcribeRequested,
    requireSuccess(
      await httpClient.post<MeetingItem>("/api/meetings", payload),
    ),
  );
}

export type UpdateMeetingPayload = {
  notes?: string;
  outcomes?: string;
  status?: MeetingStatus;
  transcriptBotDispatched?: boolean;
  meetLink?: string;
  transcribeRequested?: boolean;
};

export type MeetingFeedbackPayload = {
  ratings: number[];
  benefits: string[];
};

export type MeetingFeedbackItem = {
  id: string;
  meetingId: string;
  authorId: string;
  ratings: number[];
  benefits: string[];
  createdAt: string;
};

export async function getMeetingFeedback(meetingId: string) {
  const response = await httpClient.get<MeetingFeedbackItem>(
    `/api/meetings/${encodeURIComponent(meetingId)}/feedback`,
  );
  if (response.status === 404) return null;
  return requireSuccess(response);
}

export async function postMeetingFeedback(
  meetingId: string,
  payload: MeetingFeedbackPayload,
) {
  return requireSuccess(
    await httpClient.post(
      `/api/meetings/${encodeURIComponent(meetingId)}/feedback`,
      payload,
    ),
  );
}

export async function updateMeeting(id: string, payload: UpdateMeetingPayload) {
  return announceDroppedTranscriptBot(
    payload.transcribeRequested,
    requireSuccess(
      await httpClient.patch<MeetingItem>(
        `/api/meetings/${encodeURIComponent(id)}`,
        payload,
      ),
    ),
  );
}

export async function getMeetingRoom(id: string) {
  return requireSuccess(
    await httpClient.get<MeetingItem[]>(
      `/api/meetings/${encodeURIComponent(id)}/room`,
    ),
  );
}

export async function postMeetingGuest(
  id: string,
  payload: { organizationId?: string; mentorId?: string; programId?: string },
) {
  return requireSuccess(
    await httpClient.post<MeetingItem>(
      `/api/meetings/${encodeURIComponent(id)}/guests`,
      payload,
    ),
  );
}

export async function deleteMeeting(id: string) {
  return requireSuccess(
    await httpClient.delete(`/api/meetings/${encodeURIComponent(id)}`),
  );
}
