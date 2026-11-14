"use client";

import { useTranslations } from "next-intl";

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
import { useSignupCanContinue } from "@/hooks/use-program-eligibility";
import { useSignupWizard } from "@/hooks/use-signup-wizard";
import type { RegisteredAccount } from "@/interfaces/auth";
import { SIGNUP_STEPS, SignupStep } from "@/interfaces/signup";
import { stringList } from "@/lib/string-list";

const TONE = OnboardingTone.Mentee;

const STEP_KEYS = {
  [SignupStep.PersonalProfile]: "personal",
  [SignupStep.StartupProfile]: "startup",
  [SignupStep.Documents]: "documents",
  [SignupStep.Review]: "review",
} as const satisfies Record<SignupStep, string>;

export function SignupWizardView({ account }: { account: RegisteredAccount }) {
  const copy = useTranslations("signupWizard");
  const { submitApplication, submittedAt } = useFounderApplication(account);
  const wizard = useSignupWizard({ onSubmit: submitApplication });
  const { step, steps, isFirstStep, isLastStep } = wizard;
  const canContinue = useSignupCanContinue(wizard);
  const railSteps = SIGNUP_STEPS.filter((item) =>
    steps.includes(item.step),
  ).map((item) => ({
    ...item,
    title: copy(`steps.${STEP_KEYS[item.step]}.railTitle`),
    hint: copy(`steps.${STEP_KEYS[item.step]}.railHint`),
  }));
  const stepText = (current: SignupStep, field: "title" | "subtitle") =>
    copy(`steps.${STEP_KEYS[current]}.${field}`);
  const { exit, exiting } = useOnboardingExit(wizard.saveDraft);

  if (wizard.submitted) {
    // An individual program (İŞKUR) has no startup: its student waits for the peer mentoring area instead.
    const solo = wizard.draft.startup.individualProgram ?? false;
    const startupName = solo ? "" : wizard.draft.startup.name.trim();
    return (
      <OnboardingSubmittedView
        tone={TONE}
        name={startupName || signupFullName(wizard.draft)}
        title={
          solo
            ? copy("individualSubmittedTitle")
            : copy("submittedTitle", {
                name: startupName || copy("submittedFallbackName"),
              })
        }
        submittedAt={submittedAt ?? new Date()}
        lastStepLabel={copy(solo ? "individualLastStepLabel" : "lastStepLabel")}
        nextSteps={stringList(
          copy.raw(solo ? "individualNextSteps" : "nextSteps") as unknown,
        )}
        onSignOut={exit}
        signingOut={exiting}
      />
    );
  }

  const currentIndex = steps.indexOf(step);

  return (
    <OnboardingLayout
      topbar={
        <OnboardingTopbar
          exitLabel={copy("saveAndExit")}
          onExit={exit}
          exiting={exiting}
        />
      }
      rail={
        <OnboardingRail
          tone={TONE}
          steps={railSteps}
          currentIndex={currentIndex}
          note={copy("railNote")}
          onStepClick={(index) => {
            const next = steps[index];
            if (next) wizard.goToStep(next);
          }}
        />
      }
      title={stepText(step, "title")}
      subtitle={stepText(step, "subtitle")}
      footer={
        <OnboardingFooter
          tone={TONE}
          onBack={wizard.goBack}
          backDisabled={isFirstStep || wizard.submitting}
          onSaveDraft={wizard.saveDraft}
          saveDisabled={wizard.submitting}
          primaryLabel={
            wizard.submitting
              ? copy("sending")
              : isLastStep
                ? copy("sendToCoordinator")
                : copy("continue")
          }
          onPrimary={isLastStep ? wizard.submit : wizard.goNext}
          primaryDisabled={wizard.submitting || !canContinue}
          status={
            wizard.draftSavedAt ? (
              <span role="status" className="text-xs text-[#676e78]">
                {copy("draftSaved")}
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
