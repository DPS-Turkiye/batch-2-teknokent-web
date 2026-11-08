import type {
  InstitutionPersonSummary,
  InstitutionRecord,
} from "@/interfaces/institution";
import { requireSuccess } from "@/lib/client/api";
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
