import type { UserProfile, UserProfileInput } from "@/interfaces/user-profile";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getUserProfile() {
  return requireSuccess(
    await httpClient.get<UserProfile>("/api/users/profile"),
  );
}

export async function saveUserProfile(profile: UserProfileInput) {
  return requireSuccess(
    await httpClient.put<UserProfile>("/api/users/profile", profile),
  );
}
