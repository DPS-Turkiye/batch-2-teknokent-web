import "server-only";

import type { BackendUser } from "@/interfaces/session";
import type { TeamChange, TeamHistory } from "@/interfaces/team-change";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

function organizationUrl(organizationId: string) {
  return `/api/organizations/${encodeURIComponent(organizationId)}`;
}

export function fetchTeamChanges(organizationId: string, actorId: string) {
  return backendRequest<TeamChange[]>({
    method: HttpMethod.Get,
    url: `${organizationUrl(organizationId)}/team-changes`,
    params: { actorId },
  });
}

export function requestLeave(organizationId: string, actorId: string) {
  return backendRequest<TeamChange>({
    method: HttpMethod.Post,
    url: `${organizationUrl(organizationId)}/leave-request`,
    params: { actorId },
  });
}

export function requestRemoval(
  organizationId: string,
  memberId: string,
  actorId: string,
) {
  return backendRequest<TeamChange>({
    method: HttpMethod.Post,
    url: `${organizationUrl(organizationId)}/members/${encodeURIComponent(memberId)}/removal-request`,
    params: { actorId },
  });
}

export function cancelTeamChange(
  organizationId: string,
  requestId: string,
  actorId: string,
) {
  return backendRequest<TeamChange>({
    method: HttpMethod.Post,
    url: `${organizationUrl(organizationId)}/team-changes/${encodeURIComponent(requestId)}/cancel`,
    params: { actorId },
  });
}

/** The leader leaves at once; the answer is the leader, now without a startup. */
export function leaveTeam(
  organizationId: string,
  actorId: string,
  successorId: string | null,
) {
  return backendRequest<BackendUser>({
    method: HttpMethod.Post,
    url: `${organizationUrl(organizationId)}/leave`,
    data: { actorId, successorId },
  });
}

export function fetchTeamHistory(userId: string, actorId: string) {
  return backendRequest<TeamHistory>({
    method: HttpMethod.Get,
    url: `/api/users/${encodeURIComponent(userId)}/team-history`,
    params: { actorId },
  });
}
