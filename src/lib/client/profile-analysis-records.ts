import type {
  ProfileAnalysis,
  ProfileAnalysisRecordScope,
} from "@/interfaces/profile-analysis";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getProfileAnalysisRecord(
  scope: ProfileAnalysisRecordScope,
) {
  return requireSuccess(
    await httpClient.get<ProfileAnalysis>("/api/profile-analysis/records", {
      params: { scope },
    }),
  );
}

export async function createStartupProfileRecord(
  profile: Record<string, unknown>,
) {
  return requireSuccess(
    await httpClient.post<ProfileAnalysis>("/api/profile-analysis/records", {
      profile,
    }),
  );
}

export async function confirmStartupProfileRecord(
  id: string,
  profile: Record<string, unknown>,
) {
  return requireSuccess(
    await httpClient.patch<ProfileAnalysis>(
      `/api/profile-analysis/records/${encodeURIComponent(id)}`,
      { profile },
    ),
  );
}
