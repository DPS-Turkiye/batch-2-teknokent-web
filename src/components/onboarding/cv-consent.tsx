// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import type { OnboardingTone } from "@/components/onboarding/onboarding-tone";
import { OnboardingConsent } from "@/components/onboarding/onboarding-ui";

/**
 * The consent to read a CV with AI, shown wherever a CV can be read into a
 * profile. Its wording is placeholder copy until legal signs it off.
 */
export function CvConsent({
  tone,
  checked,
  onChange,
}: {
  tone: OnboardingTone;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const t = useTranslations("cvConsent");
  return (
    <OnboardingConsent tone={tone} checked={checked} onChange={onChange}>
      {t("label")}
    </OnboardingConsent>
  );
}
