import "server-only";

import type {
  MemberTeamMoveOptions,
  MemberTeamMoveResult,
} from "@/interfaces/team-move";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

function teamMoveUrl(userId: string) {
  return `/api/users/${encodeURIComponent(userId)}/team-move`;
}

/** The backend takes the caller from this token alone, never from the shared service credentials. */
export function fetchTeamMoveOptions(userId: string, idToken: string) {
  return backendRequest<MemberTeamMoveOptions>(
    { method: HttpMethod.Get, url: teamMoveUrl(userId) },
    { idToken },
  );
}

export function moveMemberToTeam(
  userId: string,
  targetOrganizationId: string,
  idToken: string,
) {
  return backendRequest<MemberTeamMoveResult>(
    {
      method: HttpMethod.Post,
      url: teamMoveUrl(userId),
      data: { targetOrganizationId },
    },
    { idToken },
  );
}
