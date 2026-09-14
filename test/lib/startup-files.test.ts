import { describe, expect, it } from "vitest";

import type {
  DocumentRequestItem,
  DocumentRequestUpload,
} from "@/interfaces/document-request";
import { DocumentKind } from "@/interfaces/startup-document";
import {
  buildStartupFileRows,
  countRowsByFilter,
  pendingRequestNotice,
  rowsForFilter,
  StartupFileFilter,
  StartupFileStatus,
} from "@/lib/startup-files";
import { documentFixture } from "@test/fixtures/startup-files";

const TEAM = new Set(["user-1"]);

function requestItem(
  id: string,
  overrides: Partial<DocumentRequestItem> = {},
): DocumentRequestItem {
  return {
    id,
    title: `${id}.pdf`,
    sortOrder: 0,
    dueDate: null,
    organizationId: "org-1",
    mentorshipRequestId: "request-1",
    meetingId: null,
    mentorshipId: null,
    programId: null,
    createdById: "mentor-1",
    createdByName: "Nihan Öztürk",
    createdAt: "2026-08-23T09:00:00Z",
    uploads: [],
    ...overrides,
  };
}

function upload(documentId: string): DocumentRequestUpload {
  return {
    id: `upload-${documentId}`,
    storedDocumentId: documentId,
    originalFilename: `${documentId}.fig`,
    contentType: "application/octet-stream",
    sizeBytes: 6_400_000,
    uploadedById: "user-1",
    uploadedByName: "Gülse Buran",
    createdAt: "2026-08-24T09:00:00Z",
  };
}

describe("buildStartupFileRows", () => {
  it("lists a requested file once, under the request that asked for it", () => {
    const rows = buildStartupFileRows({
      documents: [documentFixture("flow")],
      requests: [requestItem("flow-request", { uploads: [upload("flow")] })],
      teamMemberIds: TEAM,
      programName: null,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      title: "flow.fig",
      source: "Nihan Öztürk istedi",
      related: "Mentorluk belgesi",
      status: StartupFileStatus.Sent,
      filters: [StartupFileFilter.Mentorship],
      ownDocument: null,
    });
  });

  it("shows an answered request as reviewed once its file is reviewed", () => {
    const rows = buildStartupFileRows({
      documents: [
        documentFixture("flow", { reviewedAt: "2026-08-25T09:00:00Z" }),
      ],
      requests: [requestItem("flow-request", { uploads: [upload("flow")] })],
      teamMemberIds: TEAM,
      programName: null,
    });

    expect(rows[0].status).toBe(StartupFileStatus.Reviewed);
  });

  it("waits on a program request nothing was uploaded for", () => {
    const rows = buildStartupFileRows({
      documents: [],
      requests: [
        requestItem("deck", {
          title: "pitch-deck-v3.pdf",
          mentorshipRequestId: null,
          programId: "program-1",
          createdByName: "Ece Koordinatör",
        }),
      ],
      teamMemberIds: TEAM,
      programName: "METU Stars 2026",
    });

    expect(rows[0]).toMatchObject({
      title: "pitch-deck-v3.pdf",
      sizeBytes: null,
      documentId: null,
      source: "Ece Koordinatör istedi",
      related: "METU Stars 2026",
      status: StartupFileStatus.Waiting,
      filters: [StartupFileFilter.Program, StartupFileFilter.Pending],
    });
  });

  it("tells the startup's own files from a mentor's, newest first, without the CV", () => {
    const canvas = documentFixture("canvas", {
      createdAt: "2026-09-02T09:00:00Z",
    });
    const model = documentFixture("model", {
      meetingId: "meeting-1",
      meetingAgenda: "Finans & Business Model",
      meetingScheduledAt: "2026-08-27T09:00:00Z",
      createdAt: "2026-08-27T10:00:00Z",
    });
    const notes = documentFixture("notes", {
      uploadedById: "mentor-1",
      uploadedByName: "Nihan Öztürk",
      createdAt: "2026-08-16T09:00:00Z",
    });
    const cv = documentFixture("cv", { kind: DocumentKind.Cv });

    const rows = buildStartupFileRows({
      documents: [notes, cv, model, canvas],
      requests: [],
      teamMemberIds: TEAM,
      programName: null,
    });

    expect(rows.map((row) => row.key)).toEqual([
      "document:canvas",
      "document:model",
      "document:notes",
    ]);
    expect(rows[0]).toMatchObject({
      source: "Gülse Buran yükledi",
      related: "Startup dokümanı",
      status: StartupFileStatus.Current,
      filters: [StartupFileFilter.Startup],
      ownDocument: canvas,
    });
    expect(rows[1]).toMatchObject({
      source: "Gülse Buran paylaştı",
      related: "Finans & Business Model · 27 Ağu görüşmesi",
      filters: [StartupFileFilter.Mentorship],
      ownDocument: model,
    });
    expect(rows[2]).toMatchObject({
      source: "Nihan Öztürk paylaştı",
      status: StartupFileStatus.FromMentor,
      ownDocument: null,
    });
  });

  it("counts a file with no recorded uploader as the startup's own", () => {
    const legacy = documentFixture("legacy", {
      uploadedById: null,
      uploadedByName: null,
    });

    const [row] = buildStartupFileRows({
      documents: [legacy],
      requests: [],
      teamMemberIds: TEAM,
      programName: null,
    });

    expect(row).toMatchObject({
      source: "Bilinmeyen kişi yükledi",
      status: StartupFileStatus.Current,
      filters: [StartupFileFilter.Startup],
      ownDocument: legacy,
    });
  });
});

describe("filtering the table", () => {
  it("counts every filter and narrows the rows to one", () => {
    const rows = buildStartupFileRows({
      documents: [documentFixture("canvas")],
      requests: [requestItem("deck", { programId: "program-1" })],
      teamMemberIds: TEAM,
      programName: null,
    });

    expect(countRowsByFilter(rows)).toEqual({
      [StartupFileFilter.All]: 2,
      [StartupFileFilter.Mentorship]: 0,
      [StartupFileFilter.Program]: 1,
      [StartupFileFilter.Startup]: 1,
      [StartupFileFilter.Pending]: 1,
    });
    expect(
      rowsForFilter(rows, StartupFileFilter.Pending).map((row) => row.key),
    ).toEqual(["request:deck"]);
    expect(rowsForFilter(rows, StartupFileFilter.All)).toBe(rows);
  });
});

describe("pendingRequestNotice", () => {
  it("names the unanswered request due soonest", () => {
    expect(
      pendingRequestNotice([
        requestItem("report", { title: "Rapor", dueDate: "2026-09-10" }),
        requestItem("deck", {
          title: "pitch-deck-v3.pdf",
          createdByName: "METU Stars",
          dueDate: "2026-08-28",
        }),
        requestItem("done", {
          dueDate: "2026-08-01",
          uploads: [upload("done")],
        }),
      ]),
    ).toBe(
      "“pitch-deck-v3.pdf” METU Stars tarafından talep edildi, henüz yüklenmedi. Son tarih 28 Ağustos 2026.",
    );
  });

  it("leaves the date out when the request has none", () => {
    expect(pendingRequestNotice([requestItem("cv", { title: "CV" })])).toBe(
      "“CV” Nihan Öztürk tarafından talep edildi, henüz yüklenmedi.",
    );
  });

  it("has nothing to say when every request is answered", () => {
    expect(
      pendingRequestNotice([requestItem("done", { uploads: [upload("x")] })]),
    ).toBeNull();
  });
});
