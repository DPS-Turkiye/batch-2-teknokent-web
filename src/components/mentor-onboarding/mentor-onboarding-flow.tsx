"use client";

import { useTranslations } from "next-intl";

import { RestoredDraftNotice } from "@/components/common/restored-draft-notice";
import { MentorAreasStep } from "@/components/mentor-onboarding/steps/areas-step";
import { MentorAvailabilityStep } from "@/components/mentor-onboarding/steps/availability-step";
import { MentorProfileStep } from "@/components/mentor-onboarding/steps/profile-step";
import { MentorReviewStep } from "@/components/mentor-onboarding/steps/review-step";
import {
  OnboardingFooter,
  OnboardingLayout,
  OnboardingRail,
  OnboardingTopbar,
} from "@/components/onboarding/onboarding-layout";
import { OnboardingSubmittedView } from "@/components/onboarding/onboarding-submitted";
import { OnboardingTone } from "@/components/onboarding/onboarding-tone";
import { useMentorOnboarding } from "@/hooks/use-mentor-onboarding";
import { useOnboardingExit } from "@/hooks/use-onboarding-exit";
import {
  IntroPhase,
  MENTOR_STEP_ORDER,
  MENTOR_STEPS,
  MentorOnboardingStep,
} from "@/interfaces/mentor-onboarding";
import { stringList } from "@/lib/string-list";

const TONE = OnboardingTone.Mentor;

const STEP_KEYS = {
  [MentorOnboardingStep.Profile]: "profile",
  [MentorOnboardingStep.Areas]: "areas",
  [MentorOnboardingStep.Availability]: "availability",
  [MentorOnboardingStep.Review]: "review",
} as const satisfies Record<MentorOnboardingStep, string>;

export function MentorOnboardingFlow({ fullName = "" }: { fullName?: string }) {
  const text = useTranslations("mentorOnboarding");
  const flow = useTranslations("signupWizard");
  const railSteps = MENTOR_STEPS.map((item) => ({
    ...item,
    title: text(`steps.${STEP_KEYS[item.step]}.railTitle`),
    hint: text(`steps.${STEP_KEYS[item.step]}.railHint`),
  }));
  const wizard = useMentorOnboarding({ fullName });
  const { step, phase } = wizard;
  const { exit, exiting } = useOnboardingExit(wizard.saveDraft);

  if (wizard.submittedAt) {
    return (
      <OnboardingSubmittedView
        tone={TONE}
        name={`${wizard.draft.firstName} ${wizard.draft.lastName}`.trim()}
        title={text("submittedTitle")}
        submittedAt={wizard.submittedAt}
        lastStepLabel={text("lastStepLabel")}
        nextSteps={stringList(text.raw("nextSteps") as unknown)}
        onSignOut={exit}
        signingOut={exiting}
      />
    );
  }

  const stepKey = STEP_KEYS[step];
  const onFormScreen =
    step !== MentorOnboardingStep.Profile || phase === IntroPhase.Review;

  return (
    <OnboardingLayout
      topbar={
        <OnboardingTopbar
          exitLabel={flow("saveAndExit")}
          onExit={exit}
          exiting={exiting}
        />
      }
      rail={
        <OnboardingRail
          tone={TONE}
          steps={railSteps}
          currentIndex={MENTOR_STEP_ORDER.indexOf(step)}
          note={text(`steps.${stepKey}.note`)}
          showProgress
          onStepClick={(index) => {
            const next = MENTOR_STEP_ORDER[index];
            if (next) wizard.goToStep(next);
          }}
        />
      }
      title={text(`steps.${stepKey}.title`)}
      subtitle={text(`steps.${stepKey}.subtitle`)}
      footer={
        <OnboardingFooter
          tone={TONE}
          onBack={wizard.goBack}
          backDisabled={wizard.isFirstScreen || wizard.isSaving}
          onSaveDraft={wizard.saveDraft}
          saveDisabled={wizard.isSaving}
          primaryLabel={
            wizard.isSaving
              ? flow("sending")
              : wizard.isLastStep
                ? flow("sendToCoordinator")
                : flow("continue")
          }
          onPrimary={wizard.isLastStep ? wizard.complete : wizard.goNext}
          primaryDisabled={
            wizard.isSaving || !onFormScreen || !wizard.canContinue
          }
          status={
            wizard.draftSavedAt ? (
              <span role="status" className="text-xs text-[#676e78]">
                {flow("draftSaved")}
              </span>
            ) : null
          }
        />
      }
    >
      <RestoredDraftNotice droppedFiles={wizard.droppedFiles} />
      {step === MentorOnboardingStep.Profile ? (
        <MentorProfileStep wizard={wizard} />
      ) : null}
      {step === MentorOnboardingStep.Areas ? (
        <MentorAreasStep wizard={wizard} />
      ) : null}
      {step === MentorOnboardingStep.Availability ? (
        <MentorAvailabilityStep wizard={wizard} />
      ) : null}
      {step === MentorOnboardingStep.Review ? (
        <MentorReviewStep wizard={wizard} />
      ) : null}
      {wizard.saveError ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {wizard.saveError}
        </p>
      ) : null}
    </OnboardingLayout>
  );
}
