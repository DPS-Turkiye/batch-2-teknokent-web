import type { MeetingItem, MeetingStatus } from "@/interfaces/meeting";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getMeetings() {
  return requireSuccess(await httpClient.get<MeetingItem[]>("/api/meetings"));
}

export async function postMeeting(payload: Record<string, unknown>) {
  return requireSuccess(
    await httpClient.post<MeetingItem>("/api/meetings", payload),
  );
}

export type UpdateMeetingPayload = {
  notes?: string;
  outcomes?: string;
  status?: MeetingStatus;
  transcriptBotDispatched?: boolean;
};

export type MeetingFeedbackPayload = {
  ratings: number[];
  benefits: string[];
};

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
  return requireSuccess(
    await httpClient.patch<MeetingItem>(
      `/api/meetings/${encodeURIComponent(id)}`,
      payload,
    ),
  );
}
