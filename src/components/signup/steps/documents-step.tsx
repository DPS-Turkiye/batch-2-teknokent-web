"use client";

import {
  OnboardingCard,
  OnboardingField,
  OnboardingFileField,
  OnboardingNote,
  onboardingInputClass,
} from "@/components/onboarding/onboarding-ui";
import {
  ONBOARDING_TONES,
  OnboardingTone,
} from "@/components/onboarding/onboarding-tone";
import type { StartupDraftForm } from "@/hooks/use-startup-draft";
import { useStoredDocuments } from "@/hooks/use-stored-documents";
import { StartupDocumentKind } from "@/interfaces/signup";
import { useTranslations } from "next-intl";

const TONE = OnboardingTone.Mentee;
const inputClass = `${onboardingInputClass} ${ONBOARDING_TONES[TONE].focus}`;

const FILE_CARDS: {
  kind: StartupDocumentKind;
  title: string;
  subtitle: "canvasSubtitle" | "pitchSubtitle";
  accept: string;
  helpText: "canvasHelp" | "pitchHelp";
}[] = [
  {
    kind: StartupDocumentKind.Canvas,
    title: "Business Model Canvas",
    subtitle: "canvasSubtitle",
    accept: ".pdf,.docx",
    helpText: "canvasHelp",
  },
  {
    kind: StartupDocumentKind.PitchDeck,
    title: "Pitch Deck",
    subtitle: "pitchSubtitle",
    accept: ".pdf,.pptx",
    helpText: "pitchHelp",
  },
];

export function DocumentsStep({ wizard }: { wizard: StartupDraftForm }) {
  const copy = useTranslations("signupDocuments");
  const { draft, setDocument, setMvpUrl } = wizard;
  const stored = useStoredDocuments();

  return (
    <>
      {FILE_CARDS.map((card) => (
        <OnboardingCard
          key={card.kind}
          title={card.title}
          subtitle={copy(card.subtitle)}
        >
          <OnboardingFileField
            label={copy("pickFile", { title: card.title })}
            file={draft.documents[card.kind] ?? null}
            onChange={(file) => setDocument(card.kind, file)}
            accept={card.accept}
            helpText={copy(card.helpText)}
            storedName={stored.byKind(card.kind)?.originalFilename ?? null}
          />
        </OnboardingCard>
      ))}

      <OnboardingCard title={copy("mvpTitle")} subtitle={copy("mvpSubtitle")}>
        <OnboardingField id="signup-mvp-url" label={copy("link")} tone={TONE}>
          <input
            id="signup-mvp-url"
            className={inputClass}
            placeholder={copy("mvpPlaceholder")}
            value={draft.mvpUrl}
            onChange={(event) => setMvpUrl(event.target.value)}
          />
        </OnboardingField>
        <OnboardingFileField
          label={copy("mvpPick")}
          file={draft.documents[StartupDocumentKind.Mvp] ?? null}
          onChange={(file) => setDocument(StartupDocumentKind.Mvp, file)}
          accept=".pdf,.docx,.pptx"
          helpText={copy("mvpHelp")}
          storedName={
            stored.byKind(StartupDocumentKind.Mvp)?.originalFilename ?? null
          }
        />
      </OnboardingCard>

      <OnboardingNote icon="/onboarding/info-done.svg">
        {copy("optionalNote")}
      </OnboardingNote>
    </>
  );
}
