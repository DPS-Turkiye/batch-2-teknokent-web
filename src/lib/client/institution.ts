import type {
  AdviseeProfile,
  InstitutionPersonSummary,
  InstitutionRecord,
} from "@/interfaces/institution";
import { ClientApiError, requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function fetchInstitutionRecord() {
  return requireSuccess(
    await httpClient.get<InstitutionRecord>("/api/institution/me"),
  );
}

export async function fetchInstitutionAdvisees() {
  return requireSuccess(
    await httpClient.get<InstitutionPersonSummary[]>(
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
      await httpClient.get<AdviseeProfile>(
        `/api/institution/me/advisees/${encodeURIComponent(userId)}/profile`,
      ),
    );
  } catch (error) {
    if (error instanceof ClientApiError && error.status === 404) return null;
    throw error;
  }
}
