"use client";

import { RestoredDraftNotice } from "@/components/common/restored-draft-notice";
import {
  OnboardingFooter,
  OnboardingLayout,
  OnboardingRail,
  OnboardingTopbar,
} from "@/components/onboarding/onboarding-layout";
import { OnboardingSubmittedView } from "@/components/onboarding/onboarding-submitted";
import { OnboardingTone } from "@/components/onboarding/onboarding-tone";
import { DocumentsStep } from "@/components/signup/steps/documents-step";
import { PersonalProfileStep } from "@/components/signup/steps/personal-profile-step";
import { ReviewStep } from "@/components/signup/steps/review-step";
import { StartupProfileStep } from "@/components/signup/steps/startup-profile-step";
import {
  signupFullName,
  useFounderApplication,
} from "@/hooks/use-founder-application";
import { useOnboardingExit } from "@/hooks/use-onboarding-exit";
import { useSignupWizard } from "@/hooks/use-signup-wizard";
import type { RegisteredAccount } from "@/interfaces/auth";
import {
  SIGNUP_STEP_ORDER,
  SIGNUP_STEPS,
  SignupStep,
} from "@/interfaces/signup";
import { useLocale } from "@/components/providers/locale-provider";

const TONE = OnboardingTone.Mentee;

const STEP_KEYS = {
  [SignupStep.PersonalProfile]: "personal",
  [SignupStep.StartupProfile]: "startup",
  [SignupStep.Documents]: "documents",
  [SignupStep.Review]: "review",
} as const satisfies Record<SignupStep, string>;

export function SignupWizardView({ account }: { account: RegisteredAccount }) {
  const { messages } = useLocale();
  const copy = messages.signupWizard;
  const railSteps = SIGNUP_STEPS.map((item) => ({
    ...item,
    title: copy.steps[STEP_KEYS[item.step]].railTitle,
    hint: copy.steps[STEP_KEYS[item.step]].railHint,
  }));
  const stepCopy = (current: SignupStep) => copy.steps[STEP_KEYS[current]];
  const { submitApplication, submittedAt } = useFounderApplication(account);
  const wizard = useSignupWizard({ onSubmit: submitApplication });
  const { step, canContinue, isFirstStep, isLastStep } = wizard;
  const { exit, exiting } = useOnboardingExit(wizard.saveDraft);

  if (wizard.submitted) {
    const startupName = wizard.draft.startup.name.trim();
    return (
      <OnboardingSubmittedView
        tone={TONE}
        name={startupName || signupFullName(wizard.draft)}
        title={copy.submittedTitle(startupName || copy.submittedFallbackName)}
        submittedAt={submittedAt ?? new Date()}
        lastStepLabel={copy.lastStepLabel}
        nextSteps={copy.nextSteps}
        onSignOut={exit}
        signingOut={exiting}
      />
    );
  }

  const currentIndex = SIGNUP_STEP_ORDER.indexOf(step);

  return (
    <OnboardingLayout
      topbar={
        <OnboardingTopbar
          exitLabel={copy.saveAndExit}
          onExit={exit}
          exiting={exiting}
        />
      }
      rail={
        <OnboardingRail
          tone={TONE}
          steps={railSteps}
          currentIndex={currentIndex}
          note={copy.railNote}
          onStepClick={(index) => wizard.goToStep(SIGNUP_STEP_ORDER[index])}
        />
      }
      title={stepCopy(step).title}
      subtitle={stepCopy(step).subtitle}
      footer={
        <OnboardingFooter
          tone={TONE}
          onBack={wizard.goBack}
          backDisabled={isFirstStep || wizard.submitting}
          onSaveDraft={wizard.saveDraft}
          saveDisabled={wizard.submitting}
          primaryLabel={
            wizard.submitting
              ? copy.sending
              : isLastStep
                ? copy.sendToCoordinator
                : copy.continue
          }
          onPrimary={isLastStep ? wizard.submit : wizard.goNext}
          primaryDisabled={wizard.submitting || !canContinue}
          status={
            wizard.draftSavedAt ? (
              <span role="status" className="text-xs text-[#676e78]">
                {copy.draftSaved}
              </span>
            ) : null
          }
        />
      }
    >
      <RestoredDraftNotice droppedFiles={wizard.droppedFiles} />
      {step === SignupStep.PersonalProfile ? (
        <PersonalProfileStep wizard={wizard} />
      ) : null}
      {step === SignupStep.StartupProfile ? (
        <StartupProfileStep wizard={wizard} />
      ) : null}
      {step === SignupStep.Documents ? <DocumentsStep wizard={wizard} /> : null}
      {step === SignupStep.Review ? <ReviewStep wizard={wizard} /> : null}
      {wizard.submitError ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {wizard.submitError}
        </p>
      ) : null}
    </OnboardingLayout>
  );
}
