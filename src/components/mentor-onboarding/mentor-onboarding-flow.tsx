"use client";

import Link from "next/link";

import { PrimaryButton } from "@/components/common/primary-button";
import { RestoredDraftNotice } from "@/components/common/restored-draft-notice";
import { SecondaryButton } from "@/components/common/secondary-button";
import { MentorCompleteView } from "@/components/mentor-onboarding/complete-view";
import { CompatibilityStep } from "@/components/mentor-onboarding/steps/compatibility-step";
import { ExpertiseStep } from "@/components/mentor-onboarding/steps/expertise-step";
import { IntroStep } from "@/components/mentor-onboarding/steps/intro-step";
import { PreferencesStep } from "@/components/mentor-onboarding/steps/preferences-step";
import { useMentorOnboarding } from "@/hooks/use-mentor-onboarding";
import {
  MENTOR_STEP_LABELS,
  MENTOR_STEP_ORDER,
  MentorOnboardingStep,
} from "@/interfaces/mentor-onboarding";

function Stepper({ current }: { current: MentorOnboardingStep }) {
  return (
    <nav aria-label="Mentor profil kurulum adımları">
      <ol className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {MENTOR_STEP_ORDER.map((step) => {
          const isCurrent = step === current;
          const isDone = step < current;
          return (
            <li key={step} className="flex items-center gap-2.5">
              <span
                aria-hidden
                className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                  isCurrent
                    ? "bg-[#e86f22] text-white"
                    : isDone
                      ? "bg-[#fdebdd] text-[#c85816]"
                      : "bg-[#e4e7ea] text-[#858c96]"
                }`}
              >
                {step}
              </span>
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={`text-sm ${
                  isCurrent ? "font-semibold text-[#e86f22]" : "text-[#a4aab2]"
                }`}
              >
                {MENTOR_STEP_LABELS[step]}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function MentorOnboardingFlow() {
  const flow = useMentorOnboarding();
  const {
    step,
    completed,
    canContinue,
    isFirstStep,
    isLastStep,
    isSaving,
    uploadError,
    saveError,
  } = flow;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#22262b]">
      <header className="border-b border-[#e4e7ea] bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center gap-4 px-4 sm:px-8">
          <Link
            href="/"
            className="text-[22px] font-black tracking-[-0.08em] text-[#e5701d]"
            aria-label="metual ana sayfa"
          >
            metual
          </Link>
          <span className="ml-auto rounded-full border border-[#e4e7ea] px-3 py-1.5 text-xs text-[#676e78]">
            {completed
              ? "Başvuru gönderildi"
              : `Mentor profil kurulumu ${step}/4`}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-8 sm:px-8">
        {completed ? (
          <MentorCompleteView draft={flow.draft} />
        ) : (
          <>
            <Stepper current={step} />

            <RestoredDraftNotice droppedFiles={flow.droppedFiles} />

            <div className="mt-8">
              {step === MentorOnboardingStep.Intro ? (
                <IntroStep flow={flow} />
              ) : null}
              {step === MentorOnboardingStep.Expertise ? (
                <ExpertiseStep flow={flow} />
              ) : null}
              {step === MentorOnboardingStep.Compatibility ? (
                <CompatibilityStep flow={flow} />
              ) : null}
              {step === MentorOnboardingStep.Preferences ? (
                <PreferencesStep flow={flow} />
              ) : null}
            </div>

            {uploadError || saveError ? (
              <p
                role="alert"
                className="mx-auto mt-6 w-full max-w-[620px] rounded-xl bg-[#fdeaea] px-4 py-3 text-sm text-[#b42318]"
              >
                {uploadError || saveError}
              </p>
            ) : null}

            <div className="mx-auto mt-8 flex w-full max-w-[620px] items-center justify-between gap-3">
              <SecondaryButton onClick={flow.goBack} disabled={isFirstStep}>
                Geri
              </SecondaryButton>
              <PrimaryButton
                onClick={isLastStep ? flow.complete : flow.goNext}
                disabled={!canContinue || isSaving}
              >
                {isLastStep
                  ? isSaving
                    ? "Kaydediliyor..."
                    : "Profili tamamla"
                  : "Devam et"}
              </PrimaryButton>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
