"use client";
import { useTranslations } from "next-intl";
import {
  OnboardingCard,
  OnboardingChips,
  OnboardingConsent,
} from "@/components/onboarding/onboarding-ui";
import { OnboardingTone } from "@/components/onboarding/onboarding-tone";
import { StartupFields } from "@/components/signup/steps/startup-fields";
import { useProgramNames } from "@/hooks/use-programs";
import type { SignupWizard } from "@/hooks/use-signup-wizard";
const TONE = OnboardingTone.Mentee;
export function StartupProfileStep({ wizard }: { wizard: SignupWizard }) {
  const copy = useTranslations("signupSteps");
  const { draft, updateStartup } = wizard;
  const { startup } = draft;
  const programs = useProgramNames();

  const programOptions = (programs.data ?? []).map((program) => program.name);
  const selectedProgram =
    programs.data?.find((program) => program.id === startup.programId)?.name ??
    "";

  function chooseProgram(name: string) {
    const match = programs.data?.find((program) => program.name === name);
    if (match) updateStartup("programId", match.id);
  }

  return (
    <>
      <OnboardingCard
        title={copy("program")}
        subtitle={copy("programSubtitle")}
      >
        {programs.isLoading ? (
          <p className="text-xs text-[#676e78]">{copy("programsLoading")}</p>
        ) : (
          <OnboardingChips
            tone={TONE}
            label={copy("program")}
            options={programOptions}
            selected={selectedProgram ? [selectedProgram] : []}
            onToggle={chooseProgram}
          />
        )}
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
      </OnboardingCard>
      {startup.startupLater ? null : <StartupFields form={wizard} />}
    </>
  );
}

/** The startup's own fields: shared by signup and "Startup'ımı oluştur" on /startup. */
