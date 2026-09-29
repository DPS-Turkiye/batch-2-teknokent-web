import type { OnboardingDraftKind } from "@/interfaces/onboarding-draft";
import { SignupRole } from "@/interfaces/signup";

const DRAFT_ROLES: Record<OnboardingDraftKind, SignupRole> = {
  "signup-wizard": SignupRole.Founder,
  "mentor-onboarding": SignupRole.Mentor,
};

/** Back into the wizard a saved draft belongs to; without one, the role page decides. */
export function signupResumeHref(kind?: OnboardingDraftKind | null) {
  const params = new URLSearchParams({ resume: "1" });
  if (kind) params.set("role", DRAFT_ROLES[kind]);
  return `/signup?${params.toString()}`;
}
