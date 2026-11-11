import "server-only";

import type { PersonSummary } from "@/interfaces/person-summary";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

/** The backend decides who may see whom; the actor is always the signed-in admin or coordinator. */
export function fetchPersonSummary(userId: string, actorId: string) {
  return backendRequest<PersonSummary>({
    method: HttpMethod.Get,
    url: `/api/users/${encodeURIComponent(userId)}/summary`,
    params: { actorId },
  });
}
