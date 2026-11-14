import "server-only";

import type {
  AdviseeProfile,
  InstitutionPersonSummary,
  InstitutionRecord,
} from "@/interfaces/institution";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchInstitutionRecord(actorId: string) {
  return backendRequest<InstitutionRecord>({
    method: HttpMethod.Get,
    url: "/api/institution/me",
    params: { actorId },
  });
}

export function fetchInstitutionAdvisees(actorId: string) {
  return backendRequest<InstitutionPersonSummary[]>({
    method: HttpMethod.Get,
    url: "/api/institution/me/advisees",
    params: { actorId },
  });
}

/** The backend answers 404 unless the actor is the student's advisor on ODTÜ's record. */
export function fetchAdviseeProfile(actorId: string, userId: string) {
  return backendRequest<AdviseeProfile>({
    method: HttpMethod.Get,
    url: `/api/institution/me/advisees/${userId}/profile`,
    params: { actorId },
  });
}
