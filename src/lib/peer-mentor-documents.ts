import {
  PeerDocumentVisibility,
  PeerEvidenceType,
  type PeerMentorDocument,
} from "@/interfaces/peer-mentor-documents";
import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { httpUrlOrNull } from "@/lib/utils";
import {
  EvidenceCard,
  EvidenceFileProblem,
  type EvidenceCardView,
  type RequiredEvidence,
} from "@/types/peer-mentor-evidence";

/** The backend takes PDFs up to 10 MB for peer evidence (DocumentKind.PEER_EVIDENCE). */
export const PEER_EVIDENCE_MAX_BYTES = 10 * 1024 * 1024;
export const PEER_EVIDENCE_ACCEPT = ".pdf,application/pdf";

export const EVIDENCE_CARDS = Object.values(EvidenceCard);

/** The "Diğer materyaller" card's kinds, in the frame's order. */
export const OTHER_EVIDENCE_TYPES = [
  PeerEvidenceType.ReferenceLetter,
  PeerEvidenceType.Award,
  PeerEvidenceType.Volunteering,
  PeerEvidenceType.ProjectReport,
] as const;

const CARD_TYPES: Record<EvidenceCard, readonly PeerEvidenceType[]> = {
  [EvidenceCard.Transcript]: [PeerEvidenceType.Transcript],
  [EvidenceCard.Cv]: [PeerEvidenceType.Cv],
  [EvidenceCard.Certificate]: [PeerEvidenceType.Certificate],
  [EvidenceCard.Portfolio]: [PeerEvidenceType.Portfolio],
  [EvidenceCard.Other]: OTHER_EVIDENCE_TYPES,
};

/** Which chosen category makes a card required (the cards' "… kategorisi için istenir" lines). */
const REQUIRED_FOR: Partial<Record<EvidenceCard, PeerTopicCategory>> = {
  [EvidenceCard.Transcript]: PeerTopicCategory.AcademicDevelopment,
  [EvidenceCard.Cv]: PeerTopicCategory.CareerInternship,
  [EvidenceCard.Portfolio]: PeerTopicCategory.TechnicalDigital,
};

/** Each card's visibility before the mentor picks one, as the frame starts them. */
const DEFAULT_VISIBILITY: Record<EvidenceCard, PeerDocumentVisibility> = {
  [EvidenceCard.Transcript]: PeerDocumentVisibility.VerificationOnly,
  [EvidenceCard.Cv]: PeerDocumentVisibility.Profile,
  [EvidenceCard.Certificate]: PeerDocumentVisibility.VerificationOnly,
  [EvidenceCard.Portfolio]: PeerDocumentVisibility.Profile,
  [EvidenceCard.Other]: PeerDocumentVisibility.VerificationOnly,
};

export function cardOf(type: PeerEvidenceType): EvidenceCard {
  return (
    EVIDENCE_CARDS.find((card) => CARD_TYPES[card].includes(type)) ??
    EvidenceCard.Other
  );
}

/** What a file uploaded on `card` is: the card's own type, or on "Diğer materyaller" the kind picked there. */
export function uploadTypeOf(
  card: EvidenceCard,
  otherType: PeerEvidenceType,
): PeerEvidenceType {
  if (card === EvidenceCard.Other) return otherType;
  return CARD_TYPES[card][0] ?? otherType;
}

/** The category that would make `card` required, whether or not it is chosen ("… için istenir"). */
export function requiringCategory(
  card: EvidenceCard,
): PeerTopicCategory | null {
  return REQUIRED_FOR[card] ?? null;
}

/**
 * The step's cards for the mentor's evidence and chosen categories. A card with evidence shows what its first piece
 * is saved as, so the menu never claims a visibility the server does not have; an empty card shows what the mentor
 * picked for its first upload, else the card's default. The portfolio card also counts a LinkedIn link, which the
 * profile itself keeps.
 */
export function evidenceCards(
  documents: readonly PeerMentorDocument[],
  topics: readonly PeerTopicCategory[],
  chosen: Partial<Record<EvidenceCard, PeerDocumentVisibility>>,
  hasLinkedin: boolean,
): EvidenceCardView[] {
  return EVIDENCE_CARDS.map((card) => {
    const own = documents.filter((document) =>
      CARD_TYPES[card].includes(document.evidenceType),
    );
    const category = REQUIRED_FOR[card];
    return {
      card,
      requiredFor: category && topics.includes(category) ? category : null,
      documents: own,
      visibility:
        own[0]?.visibility ?? chosen[card] ?? DEFAULT_VISIBILITY[card],
      done: own.length > 0 || (card === EvidenceCard.Portfolio && hasLinkedin),
    };
  });
}

export function requiredEvidence(
  cards: readonly EvidenceCardView[],
): RequiredEvidence {
  const required = cards.flatMap((view) =>
    view.requiredFor ? [{ view, category: view.requiredFor }] : [],
  );
  const done = required.filter(({ view }) => view.done).length;
  return {
    done,
    total: required.length,
    percent:
      required.length === 0 ? 100 : Math.round((done / required.length) * 100),
    cards: required.map(({ view, category }) => ({
      card: view.card,
      category,
    })),
  };
}

/** Why a picked file cannot be uploaded, checked before it leaves the browser; null when it can. */
export function evidenceFileProblem(file: {
  name: string;
  size: number;
}): EvidenceFileProblem | null {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return EvidenceFileProblem.NotPdf;
  }
  if (file.size > PEER_EVIDENCE_MAX_BYTES) return EvidenceFileProblem.TooLarge;
  return null;
}

function hostOf(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** The profile's "Paylaşılan belgeler" (files) and the portfolio links for "Bağlantılar". */
export function sharedEvidence(documents: readonly PeerMentorDocument[]) {
  return {
    files: documents.filter((document) => document.url == null),
    // The backend only stores http(s) links; checked again here because the url becomes an href.
    // The host tells several portfolio links apart ("Portfolyo (github.com)").
    links: documents.flatMap((document) => {
      const url = httpUrlOrNull(document.url);
      return url ? [{ id: document.id, url, host: hostOf(url) }] : [];
    }),
  };
}
