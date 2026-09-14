import { describe, expect, it } from "vitest";

import { DocumentKind } from "@/interfaces/startup-document";
import {
  fileTypeLabel,
  meetingFiles,
  sharedFileRows,
  startupFiles,
} from "@/lib/startup-files";
import { documentFixture } from "@test/fixtures/startup-files";

const deck = documentFixture("deck");
const cv = documentFixture("cv", { kind: DocumentKind.Cv });
const meetingFile = documentFixture("notes", {
  kind: DocumentKind.MeetingFile,
  meetingId: "meeting-1",
});

describe("startup file sections", () => {
  it("keeps meeting files and the founder's CV out of the startup's own files", () => {
    expect(startupFiles([deck, cv, meetingFile])).toEqual([deck]);
    expect(meetingFiles([deck, cv, meetingFile])).toEqual([meetingFile]);
  });

  it("lists one row per mentor, most recently shared first", () => {
    const shared = documentFixture("canvas", {
      shares: [
        {
          mentorId: "m-1",
          mentorName: "Nihan Öztürk",
          sharedAt: "2026-09-01T09:00:00Z",
        },
        {
          mentorId: "m-2",
          mentorName: "Ahmet Yılmaz",
          sharedAt: "2026-09-05T09:00:00Z",
        },
      ],
    });

    const rows = sharedFileRows([deck, shared]);

    expect(rows.map((row) => row.key)).toEqual(["canvas:m-2", "canvas:m-1"]);
    expect(rows[0].mentorName).toBe("Ahmet Yılmaz");
  });

  it("names the file type from the extension", () => {
    expect(
      fileTypeLabel(
        documentFixture("model", { originalFilename: "model.xlsx" }),
      ),
    ).toBe("XLSX");
    expect(
      fileTypeLabel(documentFixture("x", { originalFilename: "README" })),
    ).toBe("DOSYA");
  });
});
