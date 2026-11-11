import type { PersonSummary } from "@/interfaces/person-summary";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getPersonSummary(userId: string) {
  return requireSuccess(
    await httpClient.get<PersonSummary>(
      `/api/users/${encodeURIComponent(userId)}/summary`,
    ),
  );
}
