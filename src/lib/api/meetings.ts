import "server-only";

import { backendRequest } from "@/lib/server/backend-client";

export function fetchMeetings(organizationId: string) {
  return backendRequest({
    method: "GET",
    url: "/api/meetings",
    params: { organizationId },
  });
}

export function createMeeting(
  organizationId: string,
  payload: Record<string, unknown>,
) {
  return backendRequest({
    method: "POST",
    url: "/api/meetings",
    data: { ...payload, organizationId },
  });
}

export function updateMeeting(id: string, payload: Record<string, unknown>) {
  return backendRequest({
    method: "PATCH",
    url: `/api/meetings/${encodeURIComponent(id)}`,
    data: payload,
  });
}
