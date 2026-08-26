import "server-only";

import { backendRequest } from "@/lib/server/backend-client";

export function fetchOrganizationMembers(organizationId: string) {
  return backendRequest({
    method: "GET",
    url: `/api/organizations/${encodeURIComponent(organizationId)}/members`,
  });
}

export function createOrganizationMember(
  organizationId: string,
  payload: Record<string, unknown>,
) {
  return backendRequest({
    method: "POST",
    url: `/api/organizations/${encodeURIComponent(organizationId)}/members`,
    data: payload,
  });
}
