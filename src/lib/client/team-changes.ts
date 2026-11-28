import type { TeamChange, TeamHistory } from "@/interfaces/team-change";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { sessionAfterTeamChange } from "@/lib/client/organization";
import { ownOrganizationPath } from "@/lib/client/own-organization";

/** The signed-in member's startup: leave and removal requests waiting for the coordinator. */
export async function getTeamChanges() {
  return requireSuccess(
    await backendHttp.get<TeamChange[]>(
      await ownOrganizationPath("/team-changes"),
    ),
  );
}

export async function requestLeave() {
  return requireSuccess(
    await backendHttp.post<TeamChange>(
      await ownOrganizationPath("/leave-request"),
    ),
  );
}

/** The leader asks the coordinator to remove a member. */
export async function requestRemoval(memberId: string) {
  return requireSuccess(
    await backendHttp.post<TeamChange>(
      await ownOrganizationPath(
        `/members/${encodeURIComponent(memberId)}/removal-request`,
      ),
    ),
  );
}

export async function cancelTeamChange(requestId: string) {
  return requireSuccess(
    await backendHttp.post<TeamChange>(
      await ownOrganizationPath(
        `/team-changes/${encodeURIComponent(requestId)}/cancel`,
      ),
    ),
  );
}

/** The leader leaves at once. Answers with the session, now without a startup. */
export async function leaveTeam(successorId: string | null) {
  requireSuccess(
    await backendHttp.post(await ownOrganizationPath("/leave"), {
      successorId,
    }),
  );
  return sessionAfterTeamChange();
}

export async function getTeamHistory(userId: string) {
  return requireSuccess(
    await backendHttp.get<TeamHistory>(
      `/api/users/${encodeURIComponent(userId)}/team-history`,
    ),
  );
}
