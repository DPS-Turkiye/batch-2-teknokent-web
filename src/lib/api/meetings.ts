import "server-only";

import { backendRequest } from "@/lib/server/backend-client";

export function fetchMeetings(scope: {
  organizationId?: string;
  mentorId?: string;
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

export function updateMeeting(id: string, payload: Record<string, unknown>) {
  return backendRequest({
    method: "PATCH",
    url: `/api/meetings/${encodeURIComponent(id)}`,
    data: payload,
  });
}
