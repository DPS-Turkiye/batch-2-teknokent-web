import "server-only";

import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchActionItems(mentorshipRequestId: string) {
  return backendRequest({
    method: HttpMethod.Get,
    url: "/api/actions",
    params: { mentorshipRequestId },
  });
}

export function fetchActionItemsForRequests(mentorshipRequestIds: string[]) {
  return backendRequest({
    method: HttpMethod.Get,
    url: "/api/actions",
    params: { mentorshipRequestIds: mentorshipRequestIds.join(",") },
  });
}

export function createActionItem(payload: Record<string, unknown>) {
  return backendRequest({
    method: HttpMethod.Post,
    url: "/api/actions",
    data: payload,
  });
}

export function updateActionItem(
  id: string,
  mentorshipRequestId: string,
  payload: Record<string, unknown>,
) {
  return backendRequest({
    method: HttpMethod.Patch,
    url: `/api/actions/${encodeURIComponent(id)}`,
    params: { mentorshipRequestId },
    data: payload,
  });
}
