import type { useTranslations } from "next-intl";

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

export enum StartupFileStatus {
  Sent = "sent",
  Waiting = "waiting",
  Current = "current",
  Reviewed = "reviewed",
  FromMentor = "from-mentor",
}

/** The Dosyalar tab's translator and language, for the labels built here. */
export type StartupFilesTexts = {
  t: ReturnType<typeof useTranslations<"startupFiles">>;
  locale: string;
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
  /** Set for a requested file not yet uploaded, which it can upload. */
  pendingRequest?: DocumentRequestItem;
};

function requestContext(
  item: DocumentRequestItem,
  programName: string | null,
  { t }: StartupFilesTexts,
) {
  if (item.programId) {
    return {
      filter: StartupFileFilter.Program,
      related: programName ?? t("programRequest"),
    };
  }
  return {
    filter: StartupFileFilter.Mentorship,
    related: item.meetingId ? t("meetingDoc") : t("mentorshipDoc"),
  };
}

function meetingLabel(
  document: StartupDocument,
  { t, locale }: StartupFilesTexts,
) {
  const when = document.meetingScheduledAt
    ? t("meetingOn", {
        date: formatDayMonth(new Date(document.meetingScheduledAt), locale),
      })
    : null;
  return (
    [document.meetingAgenda, when].filter(Boolean).join(" · ") || t("meeting")
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
  texts,
  student = false,
}: {
  documents: StartupDocument[];
  requests: DocumentRequestItem[];
  teamMemberIds: Set<string>;
  programName: string | null;
  texts: StartupFilesTexts;
  /** A student of an individual program: their own uploads are project documents, not startup ones. */
  student?: boolean;
}): StartupFileRow[] {
  const { t } = texts;
  const documentsById = new Map(
    documents.map((document) => [document.id, document]),
  );
  const answered = new Set<string>();
  const rows: StartupFileRow[] = [];

  for (const item of requests) {
    const { filter, related } = requestContext(item, programName, texts);
    const source = t("requested", { name: item.createdByName });
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
        pendingRequest: item,
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
    const name = document.uploadedByName ?? t("unknownPerson");
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
        source: t("shared", { name }),
        related: document.meetingId
          ? meetingLabel(document, texts)
          : t("mentorFile"),
        status: StartupFileStatus.FromMentor,
        ownDocument: null,
      });
    } else if (document.meetingId) {
      rows.push({
        ...base,
        filters: [StartupFileFilter.Mentorship],
        source: t("shared", { name }),
        related: meetingLabel(document, texts),
        status: reviewStatus(document) ?? StartupFileStatus.Current,
        ownDocument: document,
      });
    } else {
      rows.push({
        ...base,
        filters: [StartupFileFilter.Startup],
        source: t("uploaded", { name }),
        related: t(student ? "studentDoc" : "startupDoc"),
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
export function pendingRequestNotice(
  requests: DocumentRequestItem[],
  { t, locale }: StartupFilesTexts,
) {
  const [first] = requests
    .filter((item) => item.uploads.length === 0)
    .sort((left, right) =>
      (left.dueDate ?? "9999-12-31").localeCompare(
        right.dueDate ?? "9999-12-31",
      ),
    );
  if (!first) return null;
  const values = { title: first.title, name: first.createdByName };
  return first.dueDate
    ? t("pendingNoticeDue", {
        ...values,
        date: formatLongDate(calendarDay(first.dueDate).toISOString(), locale),
      })
    : t("pendingNotice", values);
}
