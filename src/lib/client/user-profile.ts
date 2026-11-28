import type { UserProfile, UserProfileInput } from "@/interfaces/user-profile";
import { requireSuccess } from "@/lib/client/api";
import {
  backendHttp,
  signedInUserId,
  withToken,
} from "@/lib/client/backend-http";

async function ownProfilePath(idToken?: string) {
  const userId = await signedInUserId(idToken);
  return `/api/users/${encodeURIComponent(userId)}/profile`;
}

/** The signed-in person's own profile. Onboarding passes the token it just got, before the session exists. */
export async function getUserProfile(idToken?: string) {
  return requireSuccess(
    await backendHttp.get<UserProfile>(
      await ownProfilePath(idToken),
      withToken(idToken),
    ),
  );
}

export async function saveUserProfile(
  profile: UserProfileInput,
  idToken?: string,
) {
  return requireSuccess(
    await backendHttp.put<UserProfile>(
      await ownProfilePath(idToken),
      profile,
      withToken(idToken),
    ),
  );
}
