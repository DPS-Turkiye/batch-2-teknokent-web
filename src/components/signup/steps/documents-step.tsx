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
import type { SignupWizard } from "@/hooks/use-signup-wizard";
import { useStoredDocuments } from "@/hooks/use-stored-documents";
import { StartupDocumentKind } from "@/interfaces/signup";

const TONE = OnboardingTone.Mentee;
const inputClass = `${onboardingInputClass} ${ONBOARDING_TONES[TONE].focus}`;

const FILE_CARDS: {
  kind: StartupDocumentKind;
  title: string;
  subtitle: string;
  accept: string;
  helpText: string;
}[] = [
  {
    kind: StartupDocumentKind.Canvas,
    title: "Business Model Canvas",
    subtitle: "İş modelini tek sayfada özetleyen doküman.",
    accept: ".pdf,.docx",
    helpText: "PDF veya DOCX · en fazla 25 MB",
  },
  {
    kind: StartupDocumentKind.PitchDeck,
    title: "Pitch Deck",
    subtitle: "Sunum dosyan. Mentorun startupını hızlıca anlamasını sağlar.",
    accept: ".pdf,.pptx",
    helpText: "PDF veya PPTX · en fazla 25 MB",
  },
];

export function DocumentsStep({ wizard }: { wizard: SignupWizard }) {
  const { draft, setDocument, setMvpUrl } = wizard;
  const stored = useStoredDocuments();

  return (
    <>
      {FILE_CARDS.map((card) => (
        <OnboardingCard
          key={card.kind}
          title={card.title}
          subtitle={card.subtitle}
        >
          <OnboardingFileField
            label={`${card.title} dosyası seç`}
            file={draft.documents[card.kind] ?? null}
            onChange={(file) => setDocument(card.kind, file)}
            accept={card.accept}
            helpText={card.helpText}
            storedName={stored.byKind(card.kind)?.originalFilename ?? null}
          />
        </OnboardingCard>
      ))}

      <OnboardingCard
        title="MVP / Prototip"
        subtitle="Yayındaki ürünün bağlantısı ya da prototip dosyası."
      >
        <OnboardingField id="signup-mvp-url" label="Bağlantı" tone={TONE}>
          <input
            id="signup-mvp-url"
            className={inputClass}
            placeholder="ornek.app veya Figma prototip linki"
            value={draft.mvpUrl}
            onChange={(event) => setMvpUrl(event.target.value)}
          />
        </OnboardingField>
        <OnboardingFileField
          label="MVP / Prototip dosyası seç"
          file={draft.documents[StartupDocumentKind.Mvp] ?? null}
          onChange={(file) => setDocument(StartupDocumentKind.Mvp, file)}
          accept=".pdf,.docx,.pptx"
          helpText="PDF, DOCX veya PPTX · en fazla 25 MB"
          storedName={
            stored.byKind(StartupDocumentKind.Mvp)?.originalFilename ?? null
          }
        />
      </OnboardingCard>

      <OnboardingNote icon="/onboarding/info-done.svg">
        Şimdi yüklemek zorunda değilsin. Startup profilin onaylandıktan sonra da
        dosya ekleyebilirsin.
      </OnboardingNote>
    </>
  );
}
