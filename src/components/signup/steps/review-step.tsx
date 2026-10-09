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
import { useTranslations } from "next-intl";

const TONE = OnboardingTone.Mentee;

export function ReviewStep({ wizard }: { wizard: SignupWizard }) {
  const t = useTranslations();
  const copy = useTranslations("signupReview");
  const NOT_UPLOADED = copy("notUploaded");
  const { draft, goToStep, setConsent } = wizard;
  const { personal, startup, documents } = draft;
  const programs = useProgramNames();
  const stored = useStoredDocuments();

  const programName =
    startup.programId === null
      ? t("signupSteps.independent")
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
        title={copy("personal")}
        onEdit={() => goToStep(SignupStep.PersonalProfile)}
        rows={[
          {
            label: copy("fullName"),
            value: `${personal.firstName} ${personal.lastName}`.trim(),
          },
          { label: copy("role"), value: personal.role.trim() },
          { label: copy("bio"), value: truncate(personal.bio.trim(), 44) },
          {
            label: copy("contact"),
            value: personal.contactPreferences
              .map((value) => CONTACT_PREFERENCE_LABELS[value])
              .join(", "),
          },
        ]}
      />
      <OnboardingReviewCard
        tone={TONE}
        title={copy("startup")}
        onEdit={() => goToStep(SignupStep.StartupProfile)}
        rows={[
          { label: copy("startupName"), value: startup.name.trim() },
          { label: copy("tagline"), value: startup.tagline.trim() },
          {
            label: copy("programStage"),
            value: [programName, startup.maturity].filter(Boolean).join(" · "),
          },
          {
            label: copy("team"),
            value: copy("teamCount", { count: startup.teamMembers.length + 1 }),
          },
          {
            label: copy("supportAreas"),
            value: startup.supportAreas.join(", "),
          },
        ]}
      />
      <OnboardingReviewCard
        tone={TONE}
        title={copy("files")}
        onEdit={() => goToStep(SignupStep.Documents)}
        rows={[
          {
            label: "Business Model Canvas",
            value: fileName(StartupDocumentKind.Canvas),
          },
          { label: "Pitch Deck", value: pitchDeck },
          { label: copy("mvp"), value: mvp },
        ]}
      />
      {missingKeyFiles ? (
        <OnboardingNote
          tone={TONE}
          icon="/onboarding/star.svg"
          title={copy("missingTitle")}
        >
          {copy("missingBody")}
        </OnboardingNote>
      ) : null}
      <OnboardingConsent
        tone={TONE}
        checked={draft.consent}
        onChange={setConsent}
      >
        {copy("consent")}
      </OnboardingConsent>
    </>
  );
}
