"use client";
import { useTranslations } from "next-intl";
import {
  OnboardingCard,
  OnboardingChips,
  OnboardingConsent,
} from "@/components/onboarding/onboarding-ui";
import { OnboardingTone } from "@/components/onboarding/onboarding-tone";
import { StartupFields } from "@/components/signup/steps/startup-fields";
import { useSignupProgramChoice } from "@/hooks/use-signup-program-choice";
import type { SignupWizard } from "@/hooks/use-signup-wizard";
const TONE = OnboardingTone.Mentee;
export function StartupProfileStep({ wizard }: { wizard: SignupWizard }) {
  const copy = useTranslations("signupSteps");
  const { draft, updateStartup } = wizard;
  const { startup } = draft;
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
        {program.individual ? (
          <p className="text-xs text-[#676e78]">{copy("individualProgram")}</p>
        ) : (
          <OnboardingConsent
            tone={TONE}
            checked={startup.startupLater ?? false}
            onChange={(checked) => updateStartup("startupLater", checked)}
          >
            <span className="flex flex-col gap-0.5">
              <span className="font-medium text-[#22262b]">
                {copy("startupLater")}
              </span>
              <span>{copy("startupLaterHint")}</span>
            </span>
          </OnboardingConsent>
        )}
      </OnboardingCard>
      {startup.startupLater ? null : <StartupFields form={wizard} />}
    </>
  );
}

/** The startup's own fields: shared by signup and "Startup'ımı oluştur" on /startup. */
