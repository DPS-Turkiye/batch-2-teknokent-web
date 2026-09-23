"use client";

import {
  OnboardingCard,
  OnboardingChips,
  OnboardingCounter,
  OnboardingField,
  OnboardingFileField,
  onboardingInputClass,
} from "@/components/onboarding/onboarding-ui";
import {
  ONBOARDING_TONES,
  OnboardingTone,
} from "@/components/onboarding/onboarding-tone";
import { useCvParse } from "@/hooks/use-cv-parse";
import type { SignupWizard } from "@/hooks/use-signup-wizard";
import { useStoredDocuments } from "@/hooks/use-stored-documents";
import {
  BIO_MAX_LENGTH,
  CONTACT_PREFERENCE_LABELS,
  ContactPreference,
  type UploadedFile,
} from "@/interfaces/signup";
import { applyCvParse } from "@/lib/cv-suggestions";

const TONE = OnboardingTone.Mentee;
const inputClass = `${onboardingInputClass} ${ONBOARDING_TONES[TONE].focus}`;
const CONTACT_OPTIONS = Object.values(ContactPreference);

export function PersonalProfileStep({ wizard }: { wizard: SignupWizard }) {
  const { draft, updatePersonal, toggleContactPreference } = wizard;
  const { personal } = draft;
  const cvParse = useCvParse();
  const storedCv = useStoredDocuments().byKind("cv");

  function onCvSelected(file: UploadedFile | null) {
    updatePersonal("cv", file);
    if (!file?.file) return;
    cvParse.mutate(file.file, {
      onSuccess: (parsed) => {
        // Suggestions, not an overwrite: anything already typed wins.
        const next = applyCvParse(
          { role: personal.role, bio: personal.bio, expertise: [] },
          parsed,
          { keepFilled: true, bioMaxLength: BIO_MAX_LENGTH },
        );
        if (next.role !== personal.role) updatePersonal("role", next.role);
        if (next.bio !== personal.bio) updatePersonal("bio", next.bio);
      },
    });
  }

  return (
    <>
      <OnboardingCard title="Temel bilgiler">
        <div className="flex flex-col gap-3.5 sm:flex-row">
          <OnboardingField
            id="signup-first-name"
            label="Ad"
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
            label="Soyad"
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
          label="Startup’taki rolün"
          required
          tone={TONE}
        >
          <input
            id="signup-role"
            className={inputClass}
            placeholder="Örn. Product Designer · Kurucu ortak"
            value={personal.role}
            onChange={(event) => updatePersonal("role", event.target.value)}
          />
        </OnboardingField>
        <OnboardingField id="signup-linkedin" label="LinkedIn" tone={TONE}>
          <input
            id="signup-linkedin"
            className={inputClass}
            placeholder="linkedin.com/in/kullanici-adi"
            value={personal.linkedin}
            onChange={(event) => updatePersonal("linkedin", event.target.value)}
          />
        </OnboardingField>
      </OnboardingCard>

      <OnboardingCard
        title="Kısa tanıtım"
        subtitle="Mentorun seninle ilk görüşmeden önce okuyacağı iki cümle."
      >
        <textarea
          aria-label="Kısa tanıtım"
          rows={3}
          maxLength={BIO_MAX_LENGTH}
          className={`${inputClass} min-h-20 resize-y py-3`}
          value={personal.bio}
          onChange={(event) => updatePersonal("bio", event.target.value)}
        />
        <OnboardingCounter
          hint="Mentorlar bu metni arama sonuçlarında görür"
          length={personal.bio.length}
          max={BIO_MAX_LENGTH}
        />
      </OnboardingCard>

      <OnboardingCard
        title="CV (isteğe bağlı)"
        subtitle="Yüklersen mentorun geçmişini hızlıca görür. Zorunlu değil."
      >
        <OnboardingFileField
          label="CV dosyası seç"
          file={personal.cv}
          onChange={onCvSelected}
          accept=".pdf,.docx"
          storedName={storedCv?.originalFilename ?? null}
        />
        {cvParse.isPending ? (
          <p className="text-xs text-[#676e78]" role="status">
            CV okunuyor, boş alanların dolduruluyor…
          </p>
        ) : null}
        {cvParse.error ? (
          <p className="text-xs text-[#b42318]" role="alert">
            {cvParse.error.message}
          </p>
        ) : null}
      </OnboardingCard>

      <OnboardingCard
        title="İletişim tercihin"
        subtitle="Mentorunla nasıl iletişim kurmayı tercih edersin?"
      >
        <OnboardingChips
          tone={TONE}
          label="İletişim tercihin"
          options={CONTACT_OPTIONS}
          selected={personal.contactPreferences}
          onToggle={toggleContactPreference}
          labelFor={(value) => CONTACT_PREFERENCE_LABELS[value]}
        />
      </OnboardingCard>
    </>
  );
}
