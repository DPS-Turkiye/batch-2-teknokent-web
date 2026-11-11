import "server-only";

import type { ProfileAnalysisRecordScope } from "@/interfaces/profile-analysis";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchProfileAnalysisRecord(
  actorId: string,
  scope: ProfileAnalysisRecordScope,
) {
  return backendRequest({
    method: HttpMethod.Get,
    url: "/api/profile-analysis-records",
    params: { actorId, scope },
  });
}

export function createStartupProfileRecord(
  actorId: string,
  profile: Record<string, unknown>,
) {
  return backendRequest({
    method: HttpMethod.Post,
    url: "/api/profile-analysis-records",
    params: { actorId },
    data: { profile },
  });
}

export function confirmStartupProfileRecord(
  actorId: string,
  id: string,
  profile: Record<string, unknown>,
) {
  return backendRequest({
    method: HttpMethod.Patch,
    url: `/api/profile-analysis-records/${encodeURIComponent(id)}`,
    params: { actorId },
    data: { profile },
  });
}
