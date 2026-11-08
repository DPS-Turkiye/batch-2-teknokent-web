import "server-only";

import type {
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
