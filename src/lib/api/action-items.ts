import "server-only";

import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

/** Who is asking; the backend answers only for this startup's or this mentor's own requests. */
export type ActionItemCaller =
  { organizationId: string } | { mentorId: string };

export function fetchActionItems(
  mentorshipRequestId: string,
  caller: ActionItemCaller,
) {
  return backendRequest({
    method: HttpMethod.Get,
    url: "/api/actions",
    params: { mentorshipRequestId, ...caller },
  });
}

export function fetchActionItemsForRequests(
  mentorshipRequestIds: string[],
  caller: ActionItemCaller,
) {
  return backendRequest({
    method: HttpMethod.Get,
    url: "/api/actions",
    params: { mentorshipRequestIds: mentorshipRequestIds.join(","), ...caller },
  });
}

export function updateActionItem(
  id: string,
  organizationId: string,
  payload: Record<string, unknown>,
) {
  return backendRequest({
    method: HttpMethod.Patch,
    url: `/api/actions/${encodeURIComponent(id)}`,
    params: { organizationId },
    data: payload,
  });
}
