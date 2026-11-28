import type {
  AdviseeProfile,
  InstitutionPersonSummary,
  InstitutionRecord,
} from "@/interfaces/institution";
import { ClientApiError, requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

export async function fetchInstitutionRecord() {
  return requireSuccess(
    await backendHttp.get<InstitutionRecord>("/api/institution/me"),
  );
}

export async function fetchInstitutionAdvisees() {
  return requireSuccess(
    await backendHttp.get<InstitutionPersonSummary[]>(
      "/api/institution/me/advisees",
    ),
  );
}

/** One advisee's interests and goal; null when the signed-in academician is not their advisor. */
export async function fetchAdviseeProfile(
  userId: string,
): Promise<AdviseeProfile | null> {
  try {
    return requireSuccess(
      await backendHttp.get<AdviseeProfile>(
        `/api/institution/me/advisees/${encodeURIComponent(userId)}/profile`,
      ),
    );
  } catch (error) {
    if (error instanceof ClientApiError && error.status === 404) return null;
    throw error;
  }
}
