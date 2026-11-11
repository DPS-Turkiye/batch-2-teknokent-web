import { vi } from "vitest";

import type { SignupWizard } from "@/hooks/use-signup-wizard";
import { emptySignupDraft } from "@/hooks/use-startup-draft";
import {
  BIO_MAX_LENGTH,
  SIGNUP_STEP_ORDER,
  SignupStep,
  TAGLINE_MAX_LENGTH,
  type PersonalProfileDraft,
  type SignupDraft,
  type StartupProfileDraft,
} from "@/interfaces/signup";

/** An empty signup draft with the given personal and startup fields filled in. */
export function signupDraft(
  parts: {
    personal?: Partial<PersonalProfileDraft>;
    startup?: Partial<StartupProfileDraft>;
  } & Partial<Omit<SignupDraft, "personal" | "startup">> = {},
): SignupDraft {
  const { personal, startup, ...rest } = parts;
  const base = emptySignupDraft();
  return {
    ...base,
    ...rest,
    personal: { ...base.personal, ...personal },
    startup: { ...base.startup, ...startup },
  };
}

/** What useSignupWizard returns on its first step with an empty draft; every action is a spy. */
export function signupWizardStub(
  overrides: Partial<SignupWizard> = {},
): SignupWizard {
  return {
    step: SignupStep.PersonalProfile,
    steps: SIGNUP_STEP_ORDER,
    draft: signupDraft(),
    submitted: false,
    submitting: false,
    submitError: "",
    draftSavedAt: null,
    droppedFiles: 0,
    bioRemaining: BIO_MAX_LENGTH,
    taglineRemaining: TAGLINE_MAX_LENGTH,
    canContinue: false,
    supportAreaLimitReached: false,
    isFirstStep: true,
    isLastStep: false,
    goToStep: vi.fn<SignupWizard["goToStep"]>(),
    goNext: vi.fn<SignupWizard["goNext"]>(),
    goBack: vi.fn<SignupWizard["goBack"]>(),
    submit: vi.fn<SignupWizard["submit"]>(),
    saveDraft: vi.fn<SignupWizard["saveDraft"]>(),
    toggleContactPreference: vi.fn<SignupWizard["toggleContactPreference"]>(),
    setConsent: vi.fn<SignupWizard["setConsent"]>(),
    updatePersonal: vi.fn<SignupWizard["updatePersonal"]>(),
    updateStartup: vi.fn<SignupWizard["updateStartup"]>(),
    toggleSupportArea: vi.fn<SignupWizard["toggleSupportArea"]>(),
    addTeamMember: vi.fn<SignupWizard["addTeamMember"]>(),
    removeTeamMember: vi.fn<SignupWizard["removeTeamMember"]>(),
    setMvpUrl: vi.fn<SignupWizard["setMvpUrl"]>(),
    setDocument: vi.fn<SignupWizard["setDocument"]>(),
    ...overrides,
  };
}
