import type { MeetingItem, MeetingStatus } from "@/interfaces/meeting";
import type { UserRole } from "@/interfaces/session";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

/** `as` picks the side for an account that mentors and is mentored; omitted, the primary role decides. */
export async function getMeetings(as?: UserRole.Mentor | UserRole.Mentee) {
  return requireSuccess(
    await httpClient.get<MeetingItem[]>(
      "/api/meetings",
      as ? { params: { as } } : undefined,
    ),
  );
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
  const response = await httpClient.get<string[]>("/api/meetings/feedback", {
    params: { meetingIds: meetingIds.join(",") },
  });
  return requireSuccess(response);
}

export async function getMeetingFeedback(meetingId: string) {
  const response = await httpClient.get<MeetingFeedbackItem>(
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

export async function setMeetingHeld(id: string, held: boolean) {
  const url = `/api/meetings/${encodeURIComponent(id)}/held`;
  return requireSuccess(
    held
      ? await httpClient.post<MeetingItem>(url)
      : await httpClient.delete<MeetingItem>(url),
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
