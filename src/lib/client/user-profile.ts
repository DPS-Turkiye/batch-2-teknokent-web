import type { UserProfile, UserProfileInput } from "@/interfaces/user-profile";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getUserProfile(idToken?: string) {
  return requireSuccess(
    await httpClient.get<UserProfile>(
      "/api/users/profile",
      idToken ? { headers: { Authorization: `Bearer ${idToken}` } } : undefined,
    ),
  );
}

export async function saveUserProfile(
  profile: UserProfileInput,
  idToken?: string,
) {
  return requireSuccess(
    await httpClient.put<UserProfile>(
      "/api/users/profile",
      profile,
      idToken ? { headers: { Authorization: `Bearer ${idToken}` } } : undefined,
    ),
  );
}
