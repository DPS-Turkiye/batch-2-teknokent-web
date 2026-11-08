import type {
  BadgeAward,
  GateBadgeRow,
  GateBadgeState,
  PublicBadge,
} from "@/interfaces/badges";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

const programBadges = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/badges`;

export async function getMyBadges() {
  return requireSuccess(await httpClient.get<BadgeAward[]>("/api/me/badges"));
}

export async function getUserBadges(userId: string) {
  return requireSuccess(
    await httpClient.get<PublicBadge[]>(
      `/api/users/${encodeURIComponent(userId)}/badges`,
    ),
  );
}

export async function getProgramBadgeRoster(
  programId: string,
  state: GateBadgeState | null,
) {
  return requireSuccess(
    await httpClient.get<GateBadgeRow[]>(
      `${programBadges(programId)}/roster`,
      state ? { params: { state } } : undefined,
    ),
  );
}

export async function postGateBadgeAward(programId: string, userId: string) {
  return requireSuccess(
    await httpClient.post<GateBadgeRow>(`${programBadges(programId)}/awards`, {
      userId,
    }),
  );
}

export async function postGateBadgeRevoke(
  programId: string,
  awardId: string,
  reason: string,
) {
  return requireSuccess(
    await httpClient.post<GateBadgeRow>(
      `${programBadges(programId)}/awards/${encodeURIComponent(awardId)}/revoke`,
      { reason },
    ),
  );
}

export async function getAdminStudents(state: GateBadgeState | null) {
  return requireSuccess(
    await httpClient.get<GateBadgeRow[]>(
      "/api/admin/students",
      state ? { params: { state } } : undefined,
    ),
  );
}
