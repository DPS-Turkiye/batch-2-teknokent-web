import "server-only";

import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchActionItems(mentorshipRequestId: string, actorId: string) {
  return backendRequest({
    method: HttpMethod.Get,
    url: "/api/actions",
    params: { mentorshipRequestId, actorId },
  });
}

export function createActionItem(
  actorId: string,
  payload: Record<string, unknown>,
) {
  return backendRequest({
    method: HttpMethod.Post,
    url: "/api/actions",
    params: { actorId },
    data: payload,
  });
}

export function updateActionItem(
  id: string,
  mentorshipRequestId: string,
  actorId: string,
  payload: Record<string, unknown>,
) {
  return backendRequest({
    method: HttpMethod.Patch,
    url: `/api/actions/${encodeURIComponent(id)}`,
    params: { mentorshipRequestId, actorId },
    data: payload,
  });
}
