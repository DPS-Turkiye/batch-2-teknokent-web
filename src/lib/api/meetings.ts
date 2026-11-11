import "server-only";

import { backendRequest } from "@/lib/server/backend-client";

export function fetchMeetings(scope: {
  organizationId?: string | undefined;
  mentorId?: string | undefined;
}) {
  return backendRequest({
    method: "GET",
    url: "/api/meetings",
    params: scope,
  });
}

export function createMeeting(
  organizationId: string,
  payload: Record<string, unknown>,
  mentorId?: string,
) {
  return backendRequest({
    method: "POST",
    url: "/api/meetings",
    data: { ...payload, organizationId, ...(mentorId ? { mentorId } : {}) },
  });
}

export function submitMeetingFeedback(
  meetingId: string,
  authorId: string,
  payload: Record<string, unknown>,
) {
  return backendRequest({
    method: "POST",
    url: `/api/meetings/${encodeURIComponent(meetingId)}/feedback`,
    params: { authorId },
    data: payload,
  });
}

export function fetchRatedMeetingIds(meetingIds: string[], authorId: string) {
  return backendRequest({
    method: "GET",
    url: "/api/meetings/feedback",
    params: { meetingIds: meetingIds.join(","), authorId },
  });
}

export function fetchMeetingFeedback(meetingId: string, authorId: string) {
  return backendRequest({
    method: "GET",
    url: `/api/meetings/${encodeURIComponent(meetingId)}/feedback`,
    params: { authorId },
  });
}

export function updateMeeting(id: string, payload: Record<string, unknown>) {
  return backendRequest({
    method: "PATCH",
    url: `/api/meetings/${encodeURIComponent(id)}`,
    data: payload,
  });
}

export function setMeetingHeld(id: string, mentorId: string, held: boolean) {
  return backendRequest({
    method: held ? "POST" : "DELETE",
    url: `/api/meetings/${encodeURIComponent(id)}/held`,
    params: { mentorId },
  });
}

export function fetchMeetingRoom(id: string) {
  return backendRequest({
    method: "GET",
    url: `/api/meetings/${encodeURIComponent(id)}/room`,
  });
}

export function inviteMeetingGuest(
  id: string,
  payload: Record<string, unknown>,
) {
  return backendRequest({
    method: "POST",
    url: `/api/meetings/${encodeURIComponent(id)}/guests`,
    data: payload,
  });
}

export function deleteMeeting(id: string) {
  return backendRequest({
    method: "DELETE",
    url: `/api/meetings/${encodeURIComponent(id)}`,
  });
}
