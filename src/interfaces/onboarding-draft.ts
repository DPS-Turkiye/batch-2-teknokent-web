export type OnboardingDraftKind = "signup-wizard" | "mentor-onboarding";

export type OnboardingDraftRecord = {
  kind: OnboardingDraftKind;
  step: string;
  payload: unknown;
  updatedAt?: string | null;
};
