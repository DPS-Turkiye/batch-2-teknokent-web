import "server-only";

import type {
  CreateStartupInput,
  StartupProfile,
  StartupProfileInput,
  StartupStatusInput,
} from "@/interfaces/organization";
import type { BackendUser } from "@/interfaces/session";
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
    data: { ...profile, actorId },
  });
}

export function joinStartup(actorId: string, inviteCode: string) {
  return backendRequest<BackendUser>({
    method: HttpMethod.Post,
    url: "/api/organizations/join",
    data: { actorId, inviteCode },
  });
}

export function createStartup(actorId: string, input: CreateStartupInput) {
  return backendRequest<BackendUser>({
    method: HttpMethod.Post,
    url: "/api/organizations/mine",
    data: { ...input, actorId },
  });
}

export function resubmitStartup(organizationId: string, actorId: string) {
  return backendRequest<StartupProfile>({
    method: HttpMethod.Post,
    url: `/api/organizations/${encodeURIComponent(organizationId)}/resubmit`,
    params: { actorId },
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
    data: { ...status, actorId },
  });
}
