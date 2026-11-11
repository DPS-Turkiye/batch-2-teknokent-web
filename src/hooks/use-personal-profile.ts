"use client";

import { useEditableProfile } from "@/hooks/use-editable-profile";
import type { UserProfile, UserProfileInput } from "@/interfaces/user-profile";
import { getUserProfile, saveUserProfile } from "@/lib/client/user-profile";
import { validatePersonalProfile } from "@/lib/profile-validation";

export const PERSONAL_PROFILE_QUERY_KEY = ["personal-profile"] as const;

/** The free-text fields, so the form can drive them all through one setter. */
export type PersonalProfileField = Exclude<keyof UserProfileInput, "expertise">;

function toDraft(profile: UserProfile): UserProfileInput {
  return {
    fullName: profile.fullName,
    jobTitle: profile.jobTitle,
    phone: profile.phone,
    bio: profile.bio,
    linkedinUrl: profile.linkedinUrl,
    expertise: profile.expertise,
  };
}

export function usePersonalProfile() {
  return useEditableProfile({
    queryKey: PERSONAL_PROFILE_QUERY_KEY,
    load: getUserProfile,
    save: saveUserProfile,
    toDraft,
    validate: validatePersonalProfile,
  });
}
