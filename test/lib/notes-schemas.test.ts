import { describe, expect, it } from "vitest";

import { publishAssistantShareBodySchema } from "@/lib/notes-schemas";

describe("publishAssistantShareBodySchema", () => {
  it("accepts a transcript with null speaker and missing id", () => {
    const parsed = publishAssistantShareBodySchema.safeParse({
      kind: "TRANSCRIPT",
      transcript: [{ speaker: null, text: "Merhaba", at: "00:10" }],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).toEqual({
      kind: "TRANSCRIPT",
      transcript: [
        { id: "00:10-Merhaba", speaker: "Speaker", text: "Merhaba", at: "00:10" },
      ],
    });
  });

  it("accepts a report with null title and summary", () => {
    const parsed = publishAssistantShareBodySchema.safeParse({
      kind: "REPORT",
      report: {
        title: null,
        meetingDate: null,
        topic: null,
        summary: null,
        actionItems: [{ owner: null, task: "Demo hazırla", due: null }],
      },
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    if (parsed.data.kind !== "REPORT") return;
    expect(parsed.data.report.title).toBe("");
    expect(parsed.data.report.summary).toBe("");
    expect(parsed.data.report.actionItems[0]?.task).toBe("Demo hazırla");
  });
});
