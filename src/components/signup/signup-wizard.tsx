"use client";

import Link from "next/link";

import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { DocumentsStep } from "@/components/signup/steps/documents-step";
import { PersonalProfileStep } from "@/components/signup/steps/personal-profile-step";
import { ReviewStep } from "@/components/signup/steps/review-step";
import { StartupProfileStep } from "@/components/signup/steps/startup-profile-step";
import { SubmittedView } from "@/components/signup/submitted-view";
import { useSignupWizard } from "@/hooks/use-signup-wizard";
import {
  SIGNUP_STEP_LABELS,
  SIGNUP_STEP_ORDER,
  SignupStep,
} from "@/interfaces/signup";

/**
 * The single-column steps sit in a narrow centred column in Figma; the two
 * steps with a right-hand rail need the wider canvas.
 */
const STEP_WIDTH: Record<SignupStep, string> = {
  [SignupStep.PersonalProfile]: "max-w-[680px]",
  [SignupStep.StartupProfile]: "max-w-[1080px]",
  [SignupStep.Documents]: "max-w-[1080px]",
  [SignupStep.Review]: "max-w-[680px]",
};

function Stepper({ current }: { current: SignupStep }) {
  return (
    <nav aria-label="Profil kurulum adımları">
      <ol className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {SIGNUP_STEP_ORDER.map((step) => {
          const isCurrent = step === current;
          return (
            <li key={step} className="flex items-center gap-2.5">
              <span
                aria-hidden
                className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                  isCurrent
                    ? "bg-[#e86f22] text-white"
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
                {SIGNUP_STEP_LABELS[step]}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function SignupWizardView() {
  const wizard = useSignupWizard();
  const { step, submitted, canContinue, isFirstStep, isLastStep } = wizard;

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
            Profil kurulumu
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-8 sm:px-8">
        {submitted ? (
          <SubmittedView draft={wizard.draft} />
        ) : (
          <>
            <Stepper current={step} />

            <div className={`mx-auto w-full ${STEP_WIDTH[step]}`}>
              <div className="mt-8">
                {step === SignupStep.PersonalProfile ? (
                  <PersonalProfileStep wizard={wizard} />
                ) : null}
                {step === SignupStep.StartupProfile ? (
                  <StartupProfileStep wizard={wizard} />
                ) : null}
                {step === SignupStep.Documents ? (
                  <DocumentsStep wizard={wizard} />
                ) : null}
                {step === SignupStep.Review ? (
                  <ReviewStep wizard={wizard} />
                ) : null}
              </div>

              <div className="mt-8 flex items-center justify-between gap-3">
                <SecondaryButton onClick={wizard.goBack} disabled={isFirstStep}>
                  Geri
                </SecondaryButton>
                {isLastStep ? (
                  <PrimaryButton onClick={wizard.submit}>
                    Onaya gönder
                  </PrimaryButton>
                ) : (
                  <PrimaryButton
                    onClick={wizard.goNext}
                    disabled={!canContinue}
                  >
                    Devam et
                  </PrimaryButton>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
