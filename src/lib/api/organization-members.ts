import "server-only";

import { HttpMethod } from "@/lib/http-method";
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

function memberUrl(organizationId: string, memberId: string) {
  return `/api/organizations/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(memberId)}`;
}

export function updateOrganizationMember(
  organizationId: string,
  memberId: string,
  actorId: string,
  payload: Record<string, unknown>,
) {
  return backendRequest({
    method: HttpMethod.Patch,
    url: memberUrl(organizationId, memberId),
    data: { ...payload, actorId },
  });
}

export function removeOrganizationMember(
  organizationId: string,
  memberId: string,
  actorId: string,
) {
  return backendRequest({
    method: HttpMethod.Delete,
    url: memberUrl(organizationId, memberId),
    params: { actorId },
  });
}
