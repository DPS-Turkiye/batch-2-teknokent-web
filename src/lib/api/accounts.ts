import "server-only";

import type { BackendUser } from "@/interfaces/session";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

/** The backend answers 404 unless `actorId` is the person, an admin, or related to them. */
export function fetchUser(userId: string, actorId: string, timeout?: number) {
  return backendRequest<BackendUser>({
    method: HttpMethod.Get,
    url: `/api/users/${encodeURIComponent(userId)}`,
    params: { actorId },
    ...(timeout ? { timeout } : {}),
  });
}
