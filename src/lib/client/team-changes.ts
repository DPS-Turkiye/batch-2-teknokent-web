import type { AppSession } from "@/interfaces/session";
import type { TeamChange, TeamHistory } from "@/interfaces/team-change";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getTeamChanges() {
  return requireSuccess(
    await httpClient.get<TeamChange[]>("/api/team-changes"),
  );
}

export async function requestLeave() {
  return requireSuccess(
    await httpClient.post<TeamChange>("/api/team-changes/leave-request"),
  );
}

export async function requestRemoval(memberId: string) {
  return requireSuccess(
    await httpClient.post<TeamChange>(
      `/api/organization-members/${encodeURIComponent(memberId)}/removal-request`,
    ),
  );
}

export async function cancelTeamChange(requestId: string) {
  return requireSuccess(
    await httpClient.post<TeamChange>(
      `/api/team-changes/${encodeURIComponent(requestId)}/cancel`,
    ),
  );
}

/** Answers with the session, now without a startup. */
export async function leaveTeam(successorId: string | null) {
  return requireSuccess(
    await httpClient.post<AppSession>("/api/team-changes/leave", {
      successorId,
    }),
  );
}

export async function getTeamHistory(userId: string) {
  return requireSuccess(
    await httpClient.get<TeamHistory>(
      `/api/users/${encodeURIComponent(userId)}/team-history`,
    ),
  );
}
