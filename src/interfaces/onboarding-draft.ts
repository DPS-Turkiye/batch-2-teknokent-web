export const OnboardingDraftKind = {
  SignupWizard: "signup-wizard",
  MentorOnboarding: "mentor-onboarding",
} as const;

export type OnboardingDraftKind =
  (typeof OnboardingDraftKind)[keyof typeof OnboardingDraftKind];

export type OnboardingDraftRecord = {
  kind: OnboardingDraftKind;
  step: string;
  payload: unknown;
  updatedAt?: string | null;
};
