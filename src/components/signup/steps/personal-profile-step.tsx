"use client";

import { useTranslations } from "next-intl";

import {
  ONBOARDING_TONES,
  OnboardingTone,
} from "@/components/onboarding/onboarding-tone";
import {
  OnboardingCard,
  OnboardingChips,
  OnboardingCounter,
  OnboardingField,
  OnboardingFileField,
  onboardingInputClass,
} from "@/components/onboarding/onboarding-ui";
import { useSignupCv } from "@/hooks/use-signup-cv";
import type { SignupWizard } from "@/hooks/use-signup-wizard";
import { useStoredDocuments } from "@/hooks/use-stored-documents";
import { BIO_MAX_LENGTH, ContactPreference } from "@/interfaces/signup";
import { DocumentKind } from "@/interfaces/startup-document";

const TONE = OnboardingTone.Mentee;
const inputClass = `${onboardingInputClass} ${ONBOARDING_TONES[TONE].focus}`;
const CONTACT_OPTIONS = Object.values(ContactPreference);

export function PersonalProfileStep({ wizard }: { wizard: SignupWizard }) {
  const copy = useTranslations("signupSteps");
  const tOptions = useTranslations("options");
  const fields = useTranslations("auth");
  const { draft, updatePersonal, toggleContactPreference } = wizard;
  const { personal } = draft;
  const cv = useSignupCv(wizard);
  const storedCv = useStoredDocuments().byKind(DocumentKind.Cv);

  return (
    <>
      <OnboardingCard title={copy("basics")}>
        <div className="flex flex-col gap-3.5 sm:flex-row">
          <OnboardingField
            id="signup-first-name"
            label={fields("firstName")}
            required
            tone={TONE}
          >
            <input
              id="signup-first-name"
              className={inputClass}
              value={personal.firstName}
              onChange={(event) =>
                updatePersonal("firstName", event.target.value)
              }
            />
          </OnboardingField>
          <OnboardingField
            id="signup-last-name"
            label={fields("lastName")}
            required
            tone={TONE}
          >
            <input
              id="signup-last-name"
              className={inputClass}
              value={personal.lastName}
              onChange={(event) =>
                updatePersonal("lastName", event.target.value)
              }
            />
          </OnboardingField>
        </div>
        <OnboardingField
          id="signup-role"
          label={copy("role")}
          required
          tone={TONE}
        >
          <input
            id="signup-role"
            className={inputClass}
            placeholder={copy("rolePlaceholder")}
            value={personal.role}
            onChange={(event) => updatePersonal("role", event.target.value)}
          />
        </OnboardingField>
        <OnboardingField
          id="signup-linkedin"
          label={copy("linkedin")}
          tone={TONE}
        >
          <input
            id="signup-linkedin"
            className={inputClass}
            placeholder={copy("linkedinPlaceholder")}
            value={personal.linkedin}
            onChange={(event) => updatePersonal("linkedin", event.target.value)}
          />
        </OnboardingField>
      </OnboardingCard>

      <OnboardingCard title={copy("bio")} subtitle={copy("bioSubtitle")}>
        <textarea
          aria-label={copy("bio")}
          rows={3}
          maxLength={BIO_MAX_LENGTH}
          className={`${inputClass} min-h-20 resize-y py-3`}
          value={personal.bio}
          onChange={(event) => updatePersonal("bio", event.target.value)}
        />
        <OnboardingCounter
          hint={copy("bioHint")}
          length={personal.bio.length}
          max={BIO_MAX_LENGTH}
        />
      </OnboardingCard>

      <OnboardingCard title={copy("cvTitle")} subtitle={copy("cvSubtitle")}>
        <OnboardingFileField
          label={copy("cvPick")}
          file={personal.cv}
          onChange={cv.choose}
          accept=".pdf,.docx"
          storedName={storedCv?.originalFilename ?? null}
        />
        {cv.canRead ? null : (
          <>
            {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
            <p className="text-xs text-[#676e78]">{copy("cvManual")}</p>
          </>
        )}
        {cv.isReading ? (
          <p className="text-xs text-[#676e78]" role="status">
            {copy("cvReading")}
          </p>
        ) : null}
        {cv.error ? (
          <p className="text-xs text-[#b42318]" role="alert">
            {cv.error}
          </p>
        ) : null}
      </OnboardingCard>

      <OnboardingCard
        title={copy("contact")}
        subtitle={copy("contactSubtitle")}
      >
        <OnboardingChips
          tone={TONE}
          label={copy("contact")}
          options={CONTACT_OPTIONS}
          selected={personal.contactPreferences}
          onToggle={toggleContactPreference}
          labelFor={(value) => tOptions(`contactPreference.${value}`)}
        />
      </OnboardingCard>
    </>
  );
}
