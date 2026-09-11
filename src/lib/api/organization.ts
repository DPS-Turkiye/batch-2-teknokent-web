import "server-only";

import type {
  StartupProfile,
  StartupProfileInput,
  StartupStatusInput,
} from "@/interfaces/organization";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchOrganization(organizationId: string) {
  return backendRequest<StartupProfile>({
    method: HttpMethod.Get,
    url: `/api/organizations/${encodeURIComponent(organizationId)}`,
  });
}

export function updateOrganization(
  organizationId: string,
  actorId: string,
  profile: StartupProfileInput,
) {
  return backendRequest<StartupProfile>({
    method: HttpMethod.Put,
    url: `/api/organizations/${encodeURIComponent(organizationId)}`,
    data: { actorId, ...profile },
  });
}

export function updateOrganizationStatus(
  organizationId: string,
  actorId: string,
  status: StartupStatusInput,
) {
  return backendRequest<StartupProfile>({
    method: HttpMethod.Put,
    url: `/api/organizations/${encodeURIComponent(organizationId)}/status`,
    data: { actorId, ...status },
  });
}
