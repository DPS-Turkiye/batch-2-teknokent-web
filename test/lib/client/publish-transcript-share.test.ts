import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "@/lib/http-client";
import {
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

describe("publishTranscriptShare", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("posts a small edited transcript through Amplify", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({
      status: 200,
      data: { meetingId: "meeting-1" },
    } as never);

    await publishTranscriptShare("meeting-1", [line("Merhaba")]);

    expect(httpClient.post).toHaveBeenCalledWith(
      getAssistantShareApiUrl("meeting-1"),
      {
        kind: "TRANSCRIPT",
        transcript: [line("Merhaba")],
      },
    );
  });

  it("uploads a large edited transcript to S3 then publishes the key", async () => {
    const upload: TranscriptUploadUrl = {
      url: "https://s3.example/put",
      method: "PUT",
      key: "meetings/meeting-1/transcript.json",
      contentType: "application/json",
    };
    vi.mocked(httpClient.post)
      .mockResolvedValueOnce({ status: 200, data: upload } as never)
      .mockResolvedValueOnce({
        status: 200,
        data: { meetingId: "meeting-1" },
      } as never);
    const put = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", put);

    const lines = [line("x".repeat(AMPLIFY_SAFE_JSON_CHARS))];
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

  it("posts a small report through Amplify", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({
      status: 200,
      data: { meetingId: "meeting-1" },
    } as never);

    await publishReportShare("meeting-1", report("Kısa özet"));

    expect(httpClient.post).toHaveBeenCalledWith(
      getAssistantShareApiUrl("meeting-1"),
      {
        kind: "REPORT",
        report: report("Kısa özet"),
      },
    );
  });

  it("uploads a large report to S3 then publishes the key", async () => {
    const upload: TranscriptUploadUrl = {
      url: "https://s3.example/report-put",
      method: "PUT",
      key: "meetings/meeting-1/report.json",
      contentType: "application/json",
    };
    vi.mocked(httpClient.post)
      .mockResolvedValueOnce({ status: 200, data: upload } as never)
      .mockResolvedValueOnce({
        status: 200,
        data: { meetingId: "meeting-1" },
      } as never);
    const put = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", put);

    const body = report("x".repeat(AMPLIFY_SAFE_JSON_CHARS));
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
});
