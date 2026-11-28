import "server-only";

import type { UserProfile } from "@/interfaces/user-profile";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

/** The backend answers 404 unless `actorId` is the person, an admin, or related to them. */
export function fetchUserProfile(
  userId: string,
  actorId: string,
  idToken?: string,
) {
  return backendRequest<UserProfile>(
    {
      method: HttpMethod.Get,
      url: `/api/users/${encodeURIComponent(userId)}/profile`,
      params: { actorId },
    },
    idToken ? { idToken } : undefined,
  );
}
