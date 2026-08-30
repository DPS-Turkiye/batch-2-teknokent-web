import "server-only";

import { backendRequest } from "@/lib/server/backend-client";

export type OrganizationInvite = {
  organizationId: string;
  inviteCode: string;
};

export function fetchInviteCode(organizationId: string, actorId: string) {
  return backendRequest<OrganizationInvite>({
    method: "GET",
    url: `/api/organizations/${encodeURIComponent(organizationId)}/invite-code`,
    params: { actorId },
  });
}

export function regenerateInviteCode(organizationId: string, actorId: string) {
  return backendRequest<OrganizationInvite>({
    method: "POST",
    url: `/api/organizations/${encodeURIComponent(organizationId)}/invite-code`,
    data: { actorId },
  });
}
