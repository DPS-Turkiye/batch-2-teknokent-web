import type {
  PeerDocumentVisibility,
  PeerMentorDocument,
} from "@/interfaces/peer-mentor-documents";
import type { PeerTopicCategory } from "@/interfaces/peer-mentoring";

/** The cards of the wizard's "Belgeler ve kanıtlar" step (Figma 110:719), top to bottom. */
export enum EvidenceCard {
  Transcript = "transcript",
  Cv = "cv",
  Certificate = "certificate",
  Portfolio = "portfolio",
  Other = "other",
}

/** One card as the step shows it. */
export type EvidenceCardView = {
  card: EvidenceCard;
  /** The chosen category that makes this card required ("Zorunlu"); null when it is optional. */
  requiredFor: PeerTopicCategory | null;
  documents: PeerMentorDocument[];
  /** What the card's visibility menu shows, and what a new upload on it gets. */
  visibility: PeerDocumentVisibility;
  done: boolean;
};

/** "2 / 2 zorunlu belge yüklendi" and the "Kariyer ve Staj için CV · …" line under it. */
export type RequiredEvidence = {
  done: number;
  total: number;
  /** How full the banner's bar is, 0–100 (full when nothing is required). */
  percent: number;
  cards: { card: EvidenceCard; category: PeerTopicCategory }[];
};

export enum EvidenceFileProblem {
  NotPdf = "notPdf",
  TooLarge = "tooLarge",
}
