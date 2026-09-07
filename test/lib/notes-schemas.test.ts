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
        {
          id: "00:10-Merhaba",
          speaker: "Speaker",
          text: "Merhaba",
          at: "00:10",
        },
      ],
    });
  });

  it("accepts a provider transcript pointer for Amplify-safe sharing", () => {
    const parsed = publishAssistantShareBodySchema.safeParse({
      kind: "PROVIDER_TRANSCRIPT",
      platform: "google_meet",
      nativeMeetingId: "abc-defg-hij",
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).toEqual({
      kind: "PROVIDER_TRANSCRIPT",
      platform: "google_meet",
      nativeMeetingId: "abc-defg-hij",
    });
  });

  it("accepts a pointer to a transcript already uploaded to S3", () => {
    const parsed = publishAssistantShareBodySchema.safeParse({
      kind: "TRANSCRIPT_S3",
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).toEqual({ kind: "TRANSCRIPT_S3" });
  });

  it("accepts a pointer to a report already uploaded to S3", () => {
    const parsed = publishAssistantShareBodySchema.safeParse({
      kind: "REPORT_S3",
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).toEqual({ kind: "REPORT_S3" });
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
