import type {
  MemberTeamMoveOptions,
  MemberTeamMoveResult,
} from "@/interfaces/team-move";
import { requireSuccess } from "@/lib/client/api";
import { bearerHeader } from "@/lib/client/bearer";
import { httpClient } from "@/lib/http-client";

// The backend moves people only on the caller's own sign-in, so both calls carry the Firebase token.
function teamMovePath(userId: string) {
  return `/api/users/${encodeURIComponent(userId)}/team-move`;
}

export async function getTeamMoveOptions(userId: string) {
  return requireSuccess(
    await httpClient.get<MemberTeamMoveOptions>(teamMovePath(userId), {
      headers: await bearerHeader(),
    }),
  );
}

export async function moveMemberToTeam(
  userId: string,
  targetOrganizationId: string,
) {
  return requireSuccess(
    await httpClient.post<MemberTeamMoveResult>(
      teamMovePath(userId),
      { targetOrganizationId },
      { headers: await bearerHeader() },
    ),
  );
}
