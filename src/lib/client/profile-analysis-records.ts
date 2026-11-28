import type {
  ProfileAnalysis,
  ProfileAnalysisRecordScope,
} from "@/interfaces/profile-analysis";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

const RECORDS_PATH = "/api/profile-analysis-records";

/** The signed-in member's own startup's record; the backend refuses anyone but an approved startup member. */
export async function getProfileAnalysisRecord(
  scope: ProfileAnalysisRecordScope,
) {
  return requireSuccess(
    await backendHttp.get<ProfileAnalysis>(RECORDS_PATH, {
      params: { scope },
    }),
  );
}

export async function createStartupProfileRecord(
  profile: Record<string, unknown>,
) {
  return requireSuccess(
    await backendHttp.post<ProfileAnalysis>(RECORDS_PATH, { profile }),
  );
}

export async function confirmStartupProfileRecord(
  id: string,
  profile: Record<string, unknown>,
) {
  return requireSuccess(
    await backendHttp.patch<ProfileAnalysis>(
      `${RECORDS_PATH}/${encodeURIComponent(id)}`,
      { profile },
    ),
  );
}
