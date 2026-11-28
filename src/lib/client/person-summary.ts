import type { PersonSummary } from "@/interfaces/person-summary";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

export async function getPersonSummary(userId: string) {
  return requireSuccess(
    await backendHttp.get<PersonSummary>(
      `/api/users/${encodeURIComponent(userId)}/summary`,
    ),
  );
}
