import {
  DocumentKind,
  type StartupDocument,
} from "@/interfaces/startup-document";

export enum StartupFileFilter {
  All = "all",
  Profile = "profile",
  Mentor = "mentor",
  Meeting = "meeting",
}

export const STARTUP_FILE_FILTER_LABELS: Record<StartupFileFilter, string> = {
  [StartupFileFilter.All]: "Tümü",
  [StartupFileFilter.Profile]: "Profil",
  [StartupFileFilter.Mentor]: "Mentor",
  [StartupFileFilter.Meeting]: "Toplantı",
};

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  [DocumentKind.Cv]: "CV",
  [DocumentKind.Canvas]: "Business Model Canvas",
  [DocumentKind.PitchDeck]: "Pitch Deck",
  [DocumentKind.Mvp]: "MVP Dokümanı",
  [DocumentKind.Validation]: "Doğrulama çıktısı",
  [DocumentKind.Homework]: "Ödev",
  [DocumentKind.MeetingFile]: "Toplantı dosyası",
  [DocumentKind.NotePhoto]: "Toplantı fotoğrafı",
  [DocumentKind.Other]: "Diğer",
  [DocumentKind.Logo]: "Logo",
  [DocumentKind.ProfilePdf]: "Profil PDF'i",
};

/** What a startup can upload from the Dosyalar tab. */
export const UPLOADABLE_KINDS = [
  DocumentKind.PitchDeck,
  DocumentKind.Canvas,
  DocumentKind.Mvp,
  DocumentKind.Validation,
  DocumentKind.Other,
];

export type SharedFileRow = {
  key: string;
  document: StartupDocument;
  mentorName: string;
  sharedAt: string;
};

export function fileTypeLabel(document: StartupDocument) {
  const dot = document.originalFilename.lastIndexOf(".");
  return dot > 0
    ? document.originalFilename.slice(dot + 1).toUpperCase()
    : "DOSYA";
}

// A founder's CV is personal and stays on /profile, apart from the company's files.
export function startupFiles(documents: StartupDocument[]) {
  return documents.filter(
    (document) => !document.meetingId && document.kind !== DocumentKind.Cv,
  );
}

export function meetingFiles(documents: StartupDocument[]) {
  return documents.filter((document) => document.meetingId);
}

/** One row per mentor a file went to, most recently shared first. */
export function sharedFileRows(documents: StartupDocument[]): SharedFileRow[] {
  return documents
    .flatMap((document) =>
      document.shares.map((share) => ({
        key: `${document.id}:${share.mentorId}`,
        document,
        mentorName: share.mentorName,
        sharedAt: share.sharedAt,
      })),
    )
    .sort((left, right) => right.sharedAt.localeCompare(left.sharedAt));
}
