import "server-only";

import type { UserProfile, UserProfileInput } from "@/interfaces/user-profile";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchUserProfile(userId: string) {
  return backendRequest<UserProfile>({
    method: HttpMethod.Get,
    url: `/api/users/${encodeURIComponent(userId)}/profile`,
  });
}

export function updateUserProfile(userId: string, profile: UserProfileInput) {
  return backendRequest<UserProfile>({
    method: HttpMethod.Put,
    url: `/api/users/${encodeURIComponent(userId)}/profile`,
    // The backend authorizes on actorId and refuses anything but self.
    data: { actorId: userId, ...profile },
  });
}
