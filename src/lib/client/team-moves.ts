import type {
  MemberTeamMoveOptions,
  MemberTeamMoveResult,
} from "@/interfaces/team-move";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

// The backend moves people only on the caller\'s own sign-in, which the API session cookie carries.
function teamMovePath(userId: string) {
  return `/api/users/${encodeURIComponent(userId)}/team-move`;
}

export async function getTeamMoveOptions(userId: string) {
  return requireSuccess(
    await backendHttp.get<MemberTeamMoveOptions>(teamMovePath(userId)),
  );
}

export async function moveMemberToTeam(
  userId: string,
  targetOrganizationId: string,
) {
  return requireSuccess(
    await backendHttp.post<MemberTeamMoveResult>(teamMovePath(userId), {
      targetOrganizationId,
    }),
  );
}
