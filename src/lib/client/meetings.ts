import type { MeetingItem, MeetingStatus } from "@/interfaces/meeting";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp, signedInUserId } from "@/lib/client/backend-http";

/**
 * The caller's meetings on their primary side: their own as a mentor, or their team's. The backend takes both
 * from the session.
 */
export async function getMeetings() {
  return requireSuccess(await backendHttp.get<MeetingItem[]>("/api/meetings"));
}

/** A meeting of the caller's own team, without a mentor. */
export async function postMeeting(payload: Record<string, unknown>) {
  return requireSuccess(
    await backendHttp.post<MeetingItem>("/api/meetings", payload),
  );
}

/**
 * A mentor's own meeting, with the startup named by `mentorshipRequestId`, `programId` + `organizationId` or
 * `organizationId`; the backend checks the mentor may plan with it and copies a program meeting to its other
 * mentors.
 */
export async function postMentorMeeting(payload: Record<string, unknown>) {
  return requireSuccess(
    await backendHttp.post<MeetingItem>("/api/meetings", {
      ...payload,
      mentorId: await signedInUserId(),
    }),
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

/** Which of these meetings the signed-in user has already rated. */
export async function getRatedMeetingIds(meetingIds: string[]) {
  const response = await backendHttp.get<string[]>("/api/meetings/feedback", {
    params: { meetingIds: meetingIds.join(",") },
  });
  return requireSuccess(response);
}

export async function getMeetingFeedback(meetingId: string) {
  const response = await backendHttp.get<MeetingFeedbackItem>(
    `/api/meetings/${encodeURIComponent(meetingId)}/feedback`,
  );
  // Not rated yet: 204 from the backend, 404 from releases before it.
  if (response.status === 204 || response.status === 404) return null;
  return requireSuccess(response);
}

export async function postMeetingFeedback(
  meetingId: string,
  payload: MeetingFeedbackPayload,
) {
  return requireSuccess(
    await backendHttp.post<MeetingFeedbackItem>(
      `/api/meetings/${encodeURIComponent(meetingId)}/feedback`,
      payload,
    ),
  );
}

export async function updateMeeting(id: string, payload: UpdateMeetingPayload) {
  return requireSuccess(
    await backendHttp.patch<MeetingItem>(
      `/api/meetings/${encodeURIComponent(id)}`,
      payload,
    ),
  );
}

export async function setMeetingHeld(id: string, held: boolean) {
  const url = `/api/meetings/${encodeURIComponent(id)}/held`;
  return requireSuccess(
    held
      ? await backendHttp.post<MeetingItem>(url)
      : await backendHttp.delete<MeetingItem>(url),
  );
}

export async function markMeetingNoShow(id: string, note: string) {
  return requireSuccess(
    await backendHttp.post<MeetingItem>(
      `/api/meetings/${encodeURIComponent(id)}/no-show`,
      { note },
    ),
  );
}

export async function clearMeetingNoShow(id: string) {
  return requireSuccess(
    await backendHttp.delete<MeetingItem>(
      `/api/meetings/${encodeURIComponent(id)}/no-show`,
    ),
  );
}

export async function getMeetingRoom(id: string) {
  return requireSuccess(
    await backendHttp.get<MeetingItem[]>(
      `/api/meetings/${encodeURIComponent(id)}/room`,
    ),
  );
}

export async function postMeetingGuest(
  id: string,
  payload: { organizationId?: string; mentorId?: string; programId?: string },
) {
  return requireSuccess(
    await backendHttp.post<MeetingItem>(
      `/api/meetings/${encodeURIComponent(id)}/guests`,
      payload,
    ),
  );
}

export async function deleteMeeting(id: string) {
  requireSuccess(
    await backendHttp.delete<void>(`/api/meetings/${encodeURIComponent(id)}`),
  );
}
