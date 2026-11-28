import "server-only";

import type { GateBadgeRow, GateBadgeState } from "@/interfaces/badges";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

const programBadges = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/badges`;

export function fetchProgramBadgeRoster(
  actorId: string,
  programId: string,
  state: GateBadgeState | null,
) {
  return backendRequest<GateBadgeRow[]>({
    method: HttpMethod.Get,
    url: `${programBadges(programId)}/roster`,
    params: state ? { actorId, state } : { actorId },
  });
}

export function awardGateBadge(
  actorId: string,
  programId: string,
  userId: string,
) {
  return backendRequest<GateBadgeRow>({
    method: HttpMethod.Post,
    url: `${programBadges(programId)}/awards`,
    data: { actorId, userId },
  });
}

export function revokeGateBadge(
  actorId: string,
  programId: string,
  awardId: string,
  reason: string,
) {
  return backendRequest<GateBadgeRow>({
    method: HttpMethod.Post,
    url: `${programBadges(programId)}/awards/${encodeURIComponent(awardId)}/revoke`,
    data: { actorId, reason },
  });
}

export function fetchAdminStudents(
  actorId: string,
  state: GateBadgeState | null,
) {
  return backendRequest<GateBadgeRow[]>({
    method: HttpMethod.Get,
    url: "/api/admin/students",
    params: state ? { actorId, state } : { actorId },
  });
}
