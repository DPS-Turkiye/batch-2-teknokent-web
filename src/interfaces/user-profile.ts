import type { ContactPreference } from "@/interfaces/signup";

/**
 * A person's own profile — the signup wizard's first step, read back.
 *
 * Distinct from `AppSession` in `session.ts`, which is the resolved identity
 * held in the cookie (role, organization) rather than the editable profile.
 */
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string | null;
  phone: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  expertise: string[];
  contactPreferences?: ContactPreference[];
}

/** The editable half. Identity and email are not the owner's to change here. */
export type UserProfileInput = Omit<UserProfile, "id" | "email">;
