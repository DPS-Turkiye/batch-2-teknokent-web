import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "@/lib/http-client";
import {
  getAssistantShare,
  publishReportShare,
  publishTranscriptShare,
  type TranscriptUploadUrl,
} from "@/lib/client/meeting-notes";
import { AMPLIFY_SAFE_JSON_CHARS } from "@/lib/amplify-safe-body";
import { getAssistantShareApiUrl } from "@/lib/const";
import type { MeetingReport, TranscriptLine } from "@/types/assistant";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

function line(text: string): TranscriptLine {
  return { id: "s1", speaker: "Ayşe", text, at: "00:10" };
}

function transcriptUpload(): TranscriptUploadUrl {
  return {
    url: "https://s3.example/put",
    method: "PUT",
    key: "meetings/meeting-1/transcript.json",
    contentType: "application/json",
  };
}

function reportUpload(): TranscriptUploadUrl {
  return {
    url: "https://s3.example/report-put",
    method: "PUT",
    key: "meetings/meeting-1/report.json",
    contentType: "application/json",
  };
}

describe("publishTranscriptShare", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("uploads to S3 then publishes the key", async () => {
    vi.mocked(httpClient.post)
      .mockResolvedValueOnce({ status: 200, data: transcriptUpload() } as never)
      .mockResolvedValueOnce({
        status: 200,
        data: { meetingId: "meeting-1" },
      } as never);
    const put = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", put);

    const lines = [line("Merhaba")];
    await publishTranscriptShare("meeting-1", lines);

    expect(httpClient.post).toHaveBeenNthCalledWith(
      1,
      "/api/meetings/meeting-1/assistant-share/transcript-upload",
      {},
    );
    expect(put).toHaveBeenCalledWith("https://s3.example/put", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lines),
    });
    expect(httpClient.post).toHaveBeenNthCalledWith(
      2,
      getAssistantShareApiUrl("meeting-1"),
      { kind: "TRANSCRIPT_S3" },
    );
  });

  it("falls back to an Amplify post when S3 is unavailable and the body is small", async () => {
    vi.mocked(httpClient.post)
      .mockRejectedValueOnce(new Error("no s3"))
      .mockResolvedValueOnce({
        status: 200,
        data: { meetingId: "meeting-1" },
      } as never);

    await publishTranscriptShare("meeting-1", [line("Merhaba")]);

    expect(httpClient.post).toHaveBeenLastCalledWith(
      getAssistantShareApiUrl("meeting-1"),
      {
        kind: "TRANSCRIPT",
        transcript: [line("Merhaba")],
      },
    );
  });

  it("does not fall back when a large transcript cannot be uploaded", async () => {
    vi.mocked(httpClient.post).mockRejectedValue(new Error("no s3"));
    const lines = [line("x".repeat(AMPLIFY_SAFE_JSON_CHARS))];

    await expect(publishTranscriptShare("meeting-1", lines)).rejects.toThrow(
      "no s3",
    );
    expect(httpClient.post).toHaveBeenCalledTimes(1);
  });
});

describe("publishReportShare", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  function report(summary: string): MeetingReport {
    return {
      title: "Mentorluk Görüşmesi",
      meetingDate: "2026-09-07",
      topic: "Ürün",
      summary,
      topicsDiscussed: [],
      decisions: [],
      actionItems: [],
      risksOrBlockers: [],
      nextSteps: [],
      model: "gpt",
    };
  }

  it("uploads to S3 then publishes the key", async () => {
    vi.mocked(httpClient.post)
      .mockResolvedValueOnce({ status: 200, data: reportUpload() } as never)
      .mockResolvedValueOnce({
        status: 200,
        data: { meetingId: "meeting-1" },
      } as never);
    const put = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", put);

    const body = report("Kısa özet");
    await publishReportShare("meeting-1", body);

    expect(httpClient.post).toHaveBeenNthCalledWith(
      1,
      "/api/meetings/meeting-1/assistant-share/report-upload",
      {},
    );
    expect(put).toHaveBeenCalledWith("https://s3.example/report-put", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    expect(httpClient.post).toHaveBeenNthCalledWith(
      2,
      getAssistantShareApiUrl("meeting-1"),
      { kind: "REPORT_S3" },
    );
  });

  it("falls back to an Amplify post when S3 is unavailable and the body is small", async () => {
    vi.mocked(httpClient.post)
      .mockRejectedValueOnce(new Error("no s3"))
      .mockResolvedValueOnce({
        status: 200,
        data: { meetingId: "meeting-1" },
      } as never);

    await publishReportShare("meeting-1", report("Kısa özet"));

    expect(httpClient.post).toHaveBeenLastCalledWith(
      getAssistantShareApiUrl("meeting-1"),
      {
        kind: "REPORT",
        report: report("Kısa özet"),
      },
    );
  });
});

describe("getAssistantShare", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("loads transcript and report from S3 URLs", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      status: 200,
      data: {
        meetingId: "meeting-1",
        transcript: null,
        transcriptUrl: "https://s3.example/transcript",
        transcriptPublishedAt: "2026-09-01T10:00:00Z",
        report: null,
        reportUrl: "https://s3.example/report",
        reportPublishedAt: "2026-09-01T10:00:00Z",
      },
    } as never);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => ({
        ok: true,
        json: async () =>
          String(url).includes("transcript")
            ? [line("Merhaba")]
            : { title: "Rapor", summary: "Özet" },
      })),
    );

    const share = await getAssistantShare("meeting-1");

    expect(share.transcript?.[0]?.text).toBe("Merhaba");
    expect(share.report?.summary).toBe("Özet");
  });
});
