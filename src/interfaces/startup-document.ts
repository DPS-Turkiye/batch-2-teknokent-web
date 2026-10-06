/** Mirrors the backend's DocumentKind values exactly. */
export enum DocumentKind {
  Cv = "cv",
  Canvas = "canvas",
  PitchDeck = "pitch-deck",
  Mvp = "mvp",
  Validation = "validation",
  Homework = "homework",
  MeetingFile = "meeting-file",
  NotePhoto = "note-photo",
  Other = "other",
  Logo = "logo",
  Avatar = "avatar",
  ProfilePdf = "profile-pdf",
  RequestedDoc = "requested-doc",
}

export interface DocumentShare {
  mentorId: string;
  mentorName: string;
  sharedAt: string;
}

/** A document on the startup's Dosyalar tab. */
export interface StartupDocument {
  id: string;
  kind: DocumentKind;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  uploadedById: string | null;
  uploadedByName: string | null;
  meetingId: string | null;
  meetingAgenda: string | null;
  meetingScheduledAt: string | null;
  reviewedAt: string | null;
  reviewedById: string | null;
  reviewedByName: string | null;
  shares: DocumentShare[];
}

/** A short-lived signed link to open the file. */
export interface DocumentDownload {
  url: string;
  filename: string;
  contentType: string;
  id?: string;
}
