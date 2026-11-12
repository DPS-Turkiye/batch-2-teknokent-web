"use client";

import { useTranslations } from "next-intl";

import { OnboardingTone } from "@/components/onboarding/onboarding-tone";
import {
  OnboardingCard,
  OnboardingChips,
} from "@/components/onboarding/onboarding-ui";
import { StartupFields } from "@/components/signup/steps/startup-fields";
import { useSignupProgramChoice } from "@/hooks/use-signup-program-choice";
import type { SignupWizard } from "@/hooks/use-signup-wizard";

const TONE = OnboardingTone.Mentee;
export function StartupProfileStep({ wizard }: { wizard: SignupWizard }) {
  const copy = useTranslations("signupSteps");
  const program = useSignupProgramChoice(wizard);

  return (
    <>
      <OnboardingCard
        title={copy("program")}
        subtitle={copy("programSubtitle")}
      >
        {program.loading ? (
          <p className="text-xs text-[#676e78]">{copy("programsLoading")}</p>
        ) : (
          <OnboardingChips
            tone={TONE}
            label={copy("program")}
            options={program.options}
            selected={program.selectedName ? [program.selectedName] : []}
            onToggle={program.choose}
          />
        )}
        {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
        {program.checking ? (
          <p role="status" className="text-xs text-[#676e78]">
            {copy("programEligibilityChecking")}
          </p>
        ) : null}
        {program.refusal !== null ? (
          <p role="alert" className="text-xs text-[#c0392b]">
            {program.refusal || copy("programEligibilityRefused")}
          </p>
        ) : program.individual ? (
          <p className="text-xs text-[#676e78]">{copy("individualProgram")}</p>
        ) : null}
      </OnboardingCard>
      {program.individual || program.refusal !== null ? null : (
        <StartupFields form={wizard} />
      )}
    </>
  );
}

/** The startup's own fields: shared by signup and "Startup'ımı oluştur" on /startup. */
