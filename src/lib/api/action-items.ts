import "server-only";

import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchActionItems(organizationId: string) {
  return backendRequest({
    method: HttpMethod.Get,
    url: "/api/actions",
    params: { organizationId },
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
