import type { DocumentRequestItem } from "@/interfaces/document-request";
import {
  DocumentKind,
  type StartupDocument,
} from "@/interfaces/startup-document";
import { calendarDay, formatDayMonth, formatLongDate } from "@/lib/utils";

export enum StartupFileFilter {
  All = "all",
  Mentorship = "mentorship",
  Program = "program",
  Startup = "startup",
  Pending = "pending",
}

export const STARTUP_FILE_FILTER_LABELS: Record<StartupFileFilter, string> = {
  [StartupFileFilter.All]: "Tümü",
  [StartupFileFilter.Mentorship]: "Mentorluk dosyaları",
  [StartupFileFilter.Program]: "Program",
  [StartupFileFilter.Startup]: "Startup dokümanları",
  [StartupFileFilter.Pending]: "Bekleyen talep",
};

export enum StartupFileStatus {
  Sent = "sent",
  Waiting = "waiting",
  Current = "current",
  Reviewed = "reviewed",
  FromMentor = "from-mentor",
}

export const STARTUP_FILE_STATUS_LABELS: Record<StartupFileStatus, string> = {
  [StartupFileStatus.Sent]: "Gönderildi",
  [StartupFileStatus.Waiting]: "Bekliyor",
  [StartupFileStatus.Current]: "Güncel",
  [StartupFileStatus.Reviewed]: "İncelendi",
  [StartupFileStatus.FromMentor]: "Mentordan geldi",
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
  [DocumentKind.Avatar]: "Profil fotoğrafı",
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

/** One line of the Dosyalar table: a file, or a requested file not yet uploaded. */
export type StartupFileRow = {
  key: string;
  filters: StartupFileFilter[];
  title: string;
  sizeBytes: number | null;
  documentId: string | null;
  source: string;
  related: string;
  date: string;
  status: StartupFileStatus;
  /** Set for the startup's own files, which it can share or delete. */
  ownDocument: StartupDocument | null;
};

function requestContext(item: DocumentRequestItem, programName: string | null) {
  if (item.programId) {
    return {
      filter: StartupFileFilter.Program,
      related: programName ?? "Program talebi",
    };
  }
  return {
    filter: StartupFileFilter.Mentorship,
    related: item.meetingId ? "Görüşme belgesi" : "Mentorluk belgesi",
  };
}

function meetingLabel(document: StartupDocument) {
  const when = document.meetingScheduledAt
    ? `${formatDayMonth(new Date(document.meetingScheduledAt))} görüşmesi`
    : null;
  return (
    [document.meetingAgenda, when].filter(Boolean).join(" · ") || "Görüşme"
  );
}

function reviewStatus(document: StartupDocument | undefined) {
  return document?.reviewedAt ? StartupFileStatus.Reviewed : null;
}

/**
 * Merges the startup's documents with what mentors and the program asked for.
 * An uploaded answer to a request is listed once, under the request.
 */
export function buildStartupFileRows({
  documents,
  requests,
  teamMemberIds,
  programName,
}: {
  documents: StartupDocument[];
  requests: DocumentRequestItem[];
  teamMemberIds: Set<string>;
  programName: string | null;
}): StartupFileRow[] {
  const documentsById = new Map(
    documents.map((document) => [document.id, document]),
  );
  const answered = new Set<string>();
  const rows: StartupFileRow[] = [];

  for (const item of requests) {
    const { filter, related } = requestContext(item, programName);
    const source = `${item.createdByName} istedi`;
    if (item.uploads.length === 0) {
      rows.push({
        key: `request:${item.id}`,
        filters: [filter, StartupFileFilter.Pending],
        title: item.title,
        sizeBytes: null,
        documentId: null,
        source,
        related,
        date: item.createdAt,
        status: StartupFileStatus.Waiting,
        ownDocument: null,
      });
      continue;
    }
    for (const upload of item.uploads) {
      answered.add(upload.storedDocumentId);
      rows.push({
        key: `upload:${upload.id}`,
        filters: [filter],
        title: upload.originalFilename,
        sizeBytes: upload.sizeBytes,
        documentId: upload.storedDocumentId,
        source,
        related,
        date: upload.createdAt,
        status:
          reviewStatus(documentsById.get(upload.storedDocumentId)) ??
          StartupFileStatus.Sent,
        ownDocument: null,
      });
    }
  }

  // A founder's CV is personal and stays on /profile, apart from the company's files.
  for (const document of documents) {
    if (answered.has(document.id) || document.kind === DocumentKind.Cv) {
      continue;
    }
    const name = document.uploadedByName ?? "Bilinmeyen kişi";
    // This is the startup's own list, so a file with no recorded uploader is theirs.
    const fromTeam =
      document.uploadedById == null || teamMemberIds.has(document.uploadedById);
    const base = {
      key: `document:${document.id}`,
      title: document.originalFilename,
      sizeBytes: document.sizeBytes,
      documentId: document.id,
      date: document.createdAt,
    };
    if (!fromTeam) {
      rows.push({
        ...base,
        filters: [StartupFileFilter.Mentorship],
        source: `${name} paylaştı`,
        related: document.meetingId ? meetingLabel(document) : "Mentor dosyası",
        status: StartupFileStatus.FromMentor,
        ownDocument: null,
      });
    } else if (document.meetingId) {
      rows.push({
        ...base,
        filters: [StartupFileFilter.Mentorship],
        source: `${name} paylaştı`,
        related: meetingLabel(document),
        status: reviewStatus(document) ?? StartupFileStatus.Current,
        ownDocument: document,
      });
    } else {
      rows.push({
        ...base,
        filters: [StartupFileFilter.Startup],
        source: `${name} yükledi`,
        related: "Startup dokümanı",
        status: reviewStatus(document) ?? StartupFileStatus.Current,
        ownDocument: document,
      });
    }
  }

  return rows.sort((left, right) => right.date.localeCompare(left.date));
}

export function rowsForFilter(
  rows: StartupFileRow[],
  filter: StartupFileFilter,
) {
  return filter === StartupFileFilter.All
    ? rows
    : rows.filter((row) => row.filters.includes(filter));
}

export function countRowsByFilter(
  rows: StartupFileRow[],
): Record<StartupFileFilter, number> {
  return Object.fromEntries(
    Object.values(StartupFileFilter).map((filter) => [
      filter,
      rowsForFilter(rows, filter).length,
    ]),
  ) as Record<StartupFileFilter, number>;
}

/** The request due soonest that nothing has been uploaded for, as one sentence. */
export function pendingRequestNotice(requests: DocumentRequestItem[]) {
  const [first] = requests
    .filter((item) => item.uploads.length === 0)
    .sort((left, right) =>
      (left.dueDate ?? "9999-12-31").localeCompare(
        right.dueDate ?? "9999-12-31",
      ),
    );
  if (!first) return null;
  const due = first.dueDate
    ? ` Son tarih ${formatLongDate(calendarDay(first.dueDate).toISOString())}.`
    : "";
  return `“${first.title}” ${first.createdByName} tarafından talep edildi, henüz yüklenmedi.${due}`;
}
