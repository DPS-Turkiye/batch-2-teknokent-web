"use client";

import {
  OnboardingConsent,
  OnboardingNote,
  OnboardingReviewCard,
} from "@/components/onboarding/onboarding-ui";
import { OnboardingTone } from "@/components/onboarding/onboarding-tone";
import { useProgramNames } from "@/hooks/use-programs";
import type { SignupWizard } from "@/hooks/use-signup-wizard";
import { useStoredDocuments } from "@/hooks/use-stored-documents";
import {
  CONTACT_PREFERENCE_LABELS,
  SignupStep,
  StartupDocumentKind,
} from "@/interfaces/signup";
import { truncate } from "@/lib/utils";

const TONE = OnboardingTone.Mentee;
const NOT_UPLOADED = "Yüklenmedi";

export function ReviewStep({ wizard }: { wizard: SignupWizard }) {
  const { draft, goToStep, setConsent } = wizard;
  const { personal, startup, documents } = draft;
  const programs = useProgramNames();
  const stored = useStoredDocuments();

  const programName =
    startup.programId === null
      ? "Bağımsız"
      : (programs.data?.find((program) => program.id === startup.programId)
          ?.name ?? "");

  function fileName(kind: StartupDocumentKind) {
    return (
      documents[kind]?.name ??
      stored.byKind(kind)?.originalFilename ??
      NOT_UPLOADED
    );
  }

  const pitchDeck = fileName(StartupDocumentKind.PitchDeck);
  const mvpFile = fileName(StartupDocumentKind.Mvp);
  const mvp =
    mvpFile === NOT_UPLOADED ? draft.mvpUrl.trim() || NOT_UPLOADED : mvpFile;
  const missingKeyFiles = pitchDeck === NOT_UPLOADED || mvp === NOT_UPLOADED;

  return (
    <>
      <OnboardingReviewCard
        tone={TONE}
        title="Kişisel profil"
        onEdit={() => goToStep(SignupStep.PersonalProfile)}
        rows={[
          {
            label: "Ad soyad",
            value: `${personal.firstName} ${personal.lastName}`.trim(),
          },
          { label: "Rol", value: personal.role.trim() },
          { label: "Kısa tanıtım", value: truncate(personal.bio.trim(), 44) },
          {
            label: "İletişim tercihi",
            value: personal.contactPreferences
              .map((value) => CONTACT_PREFERENCE_LABELS[value])
              .join(", "),
          },
        ]}
      />
      <OnboardingReviewCard
        tone={TONE}
        title="Startup profili"
        onEdit={() => goToStep(SignupStep.StartupProfile)}
        rows={[
          { label: "Startup", value: startup.name.trim() },
          { label: "Tanım", value: startup.tagline.trim() },
          {
            label: "Program · Aşama",
            value: [programName, startup.maturity].filter(Boolean).join(" · "),
          },
          { label: "Ekip", value: `${startup.teamMembers.length + 1} üye` },
          { label: "Destek alanları", value: startup.supportAreas.join(", ") },
        ]}
      />
      <OnboardingReviewCard
        tone={TONE}
        title="Dosyalar"
        onEdit={() => goToStep(SignupStep.Documents)}
        rows={[
          {
            label: "Business Model Canvas",
            value: fileName(StartupDocumentKind.Canvas),
          },
          { label: "Pitch Deck", value: pitchDeck },
          { label: "MVP / Prototip", value: mvp },
        ]}
      />
      {missingKeyFiles ? (
        <OnboardingNote
          tone={TONE}
          icon="/onboarding/star.svg"
          title="Pitch deck ve prototip yüklemeden de gönderebilirsin"
        >
          Ancak mentorlar startupını değerlendirirken en çok bu iki dosyaya
          bakıyor. Sonradan da ekleyebilirsin.
        </OnboardingNote>
      ) : null}
      <OnboardingConsent
        tone={TONE}
        checked={draft.consent}
        onChange={setConsent}
      >
        Verdiğim bilgilerin doğru olduğunu onaylıyorum ve profilin koordinatör
        tarafından incelenmesini kabul ediyorum.
      </OnboardingConsent>
    </>
  );
}
