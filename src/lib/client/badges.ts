import type {
  AchievementProgress,
  BadgeAward,
  GateBadgeRow,
  GateBadgeState,
  PublicBadge,
} from "@/interfaces/badges";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { httpClient } from "@/lib/http-client";

const programBadges = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/badges`;

export async function getMyBadges() {
  return requireSuccess(
    await backendHttp.get<BadgeAward[]>("/api/badges/mine"),
  );
}

export async function getMyAchievements() {
  return requireSuccess(
    await backendHttp.get<AchievementProgress[]>(
      "/api/badges/mine/achievements",
    ),
  );
}

export async function getUserBadges(userId: string) {
  return requireSuccess(
    await backendHttp.get<PublicBadge[]>(
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
