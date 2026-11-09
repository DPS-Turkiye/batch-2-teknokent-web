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
import { SignupStep, StartupDocumentKind } from "@/interfaces/signup";
import { truncate } from "@/lib/utils";
import { useTranslations } from "next-intl";

const TONE = OnboardingTone.Mentee;

type ReviewRow = { label: string; value: string };

/**
 * What the startup card summarises. Each case owns its rows, so a new kind of program adds a case here
 * instead of another branch inside the card.
 */
enum StartupSummary {
  /** An individual program gives each student a team of one, so there is no startup to show or create later. */
  Individual = "INDIVIDUAL",
  Later = "LATER",
  Startup = "STARTUP",
}

function startupSummaryOf(startupLater: boolean, individual: boolean) {
  if (!startupLater) return StartupSummary.Startup;
  if (individual) return StartupSummary.Individual;
  return StartupSummary.Later;
}

export function ReviewStep({ wizard }: { wizard: SignupWizard }) {
  const copy = useTranslations("signupReview");
  const tOptions = useTranslations("options");
  const NOT_UPLOADED = copy("notUploaded");
  const { draft, goToStep, setConsent } = wizard;
  const { personal, startup, documents } = draft;
  const programs = useProgramNames();
  const stored = useStoredDocuments();

  const program = programs.data?.find(
    (candidate) => candidate.id === startup.programId,
  );
  const programName = program?.name ?? "";
  const summary = startupSummaryOf(
    startup.startupLater ?? false,
    program?.individualMentees ?? false,
  );

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
  const missingKeyFiles =
    summary === StartupSummary.Startup &&
    (pitchDeck === NOT_UPLOADED || mvp === NOT_UPLOADED);

  function startupRows(): ReviewRow[] {
    const programRow = { label: copy("program"), value: programName };
    switch (summary) {
      case StartupSummary.Individual:
        return [programRow];
      case StartupSummary.Later:
        return [
          programRow,
          { label: copy("startupName"), value: copy("startupLater") },
        ];
      case StartupSummary.Startup:
        return [
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
        ];
    }
  }

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
              .map((value) => tOptions(`contactPreference.${value}`))
              .join(", "),
          },
        ]}
      />
      <OnboardingReviewCard
        tone={TONE}
        title={copy("startup")}
        onEdit={() => goToStep(SignupStep.StartupProfile)}
        rows={startupRows()}
      />
      {summary === StartupSummary.Startup && (
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
      )}
      {missingKeyFiles && (
        <OnboardingNote
          tone={TONE}
          icon="/onboarding/star.svg"
          title={copy("missingTitle")}
        >
          {copy("missingBody")}
        </OnboardingNote>
      )}
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
