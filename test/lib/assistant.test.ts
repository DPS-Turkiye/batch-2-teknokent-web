import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addMeetingBot,
  fetchTranscript,
  generateMeetingReport,
  stopMeetingBot,
} from "@/lib/assistant";
import {
  getBotApiUrl,
  getMeetingReportApiUrl,
  getStopBotApiUrl,
  getTranscriptApiUrl,
} from "@/lib/const";
import { httpClient } from "@/lib/http-client";
import { createAxiosResponse } from "@test/fixtures/health";

vi.mock("@/lib/http-client", () => ({
  UPLOAD_TIMEOUT_MS: 120_000,
  httpClient: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock("@/lib/firebase/auth", () => ({
  currentIdToken: vi.fn(async () => "firebase-token"),
}));

function createAxiosError<T>(data: T, status: number) {
  return new AxiosError(
    "Request failed",
    String(status),
    undefined,
    undefined,
    createAxiosResponse(data, status),
  );
}

describe("assistant lib", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("addMeetingBot posts meeting url and returns data", async () => {
    const payload = {
      id: "8703d8c7-a0b6-4b05-9bb2-1d58aeb4e719",
      assistantSessionId: "8703d8c7-a0b6-4b05-9bb2-1d58aeb4e719",
      platform: "google_meet",
      status: "joining",
      title: "Mentor Bot",
    };
    vi.mocked(httpClient.post).mockResolvedValue(
      createAxiosResponse(payload, 201),
    );

    const result = await addMeetingBot("https://meet.google.com/abc-defg-hij");

    expect(httpClient.post).toHaveBeenCalledWith(
      getBotApiUrl(),
      {
        meetingUrl: "https://meet.google.com/abc-defg-hij",
      },
      { headers: { Authorization: "Bearer firebase-token" } },
    );
    expect(result).toEqual(payload);
  });

  it("addMeetingBot throws when the BFF returns an error status", async () => {
    vi.mocked(httpClient.post).mockResolvedValue(
      createAxiosResponse(
        { message: "Meeting assistant service is unavailable." },
        502,
      ),
    );

    await expect(
      addMeetingBot("https://meet.google.com/abc-defg-hij"),
    ).rejects.toThrow("Toplantı asistanı gönderilemedi.");
  });

  it("addMeetingBot throws on error status", async () => {
    vi.mocked(httpClient.post).mockRejectedValue(
      createAxiosError({ detail: "bad link" }, 400),
    );

    await expect(addMeetingBot("https://zoom.us/j/1")).rejects.toThrow(
      "Toplantı asistanı gönderilemedi.",
    );
  });

  it("fetchTranscript returns segments", async () => {
    const segments = [
      { id: "s1", speaker: "Ayşe", text: "Merhaba", at: "01:05" },
    ];
    vi.mocked(httpClient.get).mockResolvedValue(
      createAxiosResponse({ segments }, 200),
    );

    const result = await fetchTranscript(
      "8703d8c7-a0b6-4b05-9bb2-1d58aeb4e719",
    );

    expect(httpClient.get).toHaveBeenCalledWith(
      getTranscriptApiUrl("8703d8c7-a0b6-4b05-9bb2-1d58aeb4e719"),
      { headers: { Authorization: "Bearer firebase-token" } },
    );
    expect(result).toEqual(segments);
  });

  it("fetchTranscript throws on error status", async () => {
    vi.mocked(httpClient.get).mockRejectedValue(
      createAxiosError({ detail: "missing" }, 404),
    );

    await expect(
      fetchTranscript("8703d8c7-a0b6-4b05-9bb2-1d58aeb4e719"),
    ).rejects.toThrow("missing");
  });

  it("stopMeetingBot calls delete with generated url", async () => {
    vi.mocked(httpClient.delete).mockResolvedValue(
      createAxiosResponse({}, 204),
    );

    await stopMeetingBot("8703d8c7-a0b6-4b05-9bb2-1d58aeb4e719");

    expect(httpClient.delete).toHaveBeenCalledWith(
      getStopBotApiUrl("8703d8c7-a0b6-4b05-9bb2-1d58aeb4e719"),
      { headers: { Authorization: "Bearer firebase-token" } },
    );
  });

  it("stopMeetingBot uses fallback message on network failures", async () => {
    vi.mocked(httpClient.delete).mockRejectedValue(new AxiosError("Network"));

    await expect(
      stopMeetingBot("8703d8c7-a0b6-4b05-9bb2-1d58aeb4e719"),
    ).rejects.toThrow("Toplantı asistanı durdurulamadı. (ağ hatası)");
  });

  it("generateMeetingReport posts empty payload and returns report", async () => {
    const report = {
      title: "Mentorluk Gorusmesi",
      meetingDate: "2026-08-27",
      topic: "Urun Yol Haritasi",
      summary: "Toplanti verimli gecti.",
      topicsDiscussed: ["Yol haritasi"],
      decisions: ["MVP iki haftada cikacak"],
      actionItems: [{ owner: "Ayse", task: "Demo hazirla", due: "2026-09-01" }],
      risksOrBlockers: ["Kaynak kisiti"],
      nextSteps: ["Backlog netlestir"],
      model: "gpt-5.4",
    };
    vi.mocked(httpClient.post).mockResolvedValue(
      createAxiosResponse(report, 200),
    );

    const result = await generateMeetingReport(
      "8703d8c7-a0b6-4b05-9bb2-1d58aeb4e719",
      [{ id: "s1", speaker: "Ayşe", text: "Merhaba", at: "00:10" }],
    );

    expect(httpClient.post).toHaveBeenCalledWith(
      getMeetingReportApiUrl("8703d8c7-a0b6-4b05-9bb2-1d58aeb4e719"),
      {
        segments: [{ id: "s1", speaker: "Ayşe", text: "Merhaba", at: "00:10" }],
      },
      { timeout: 120_000, headers: { Authorization: "Bearer firebase-token" } },
    );
    expect(result).toEqual(report);
  });

  it("maps CloudFront HTML 403 to a Turkish error", async () => {
    vi.mocked(httpClient.post).mockRejectedValue(
      createAxiosError(
        "<html><h1>403 ERROR</h1>Generated by cloudfront (CloudFront)</html>",
        403,
      ),
    );

    await expect(
      generateMeetingReport("8703d8c7-a0b6-4b05-9bb2-1d58aeb4e719", [
        { id: "s1", speaker: "Ayşe", text: "Merhaba", at: "00:10" },
      ]),
    ).rejects.toThrow(/CloudFront tarafından engellendi/);
  });

  it("generateMeetingReport omits oversized segments so CloudFront does not block the POST", async () => {
    const report = {
      title: "Mentorluk Gorusmesi",
      summary: "Toplanti verimli gecti.",
    };
    vi.mocked(httpClient.post).mockResolvedValue(
      createAxiosResponse(report, 200),
    );
    const segments = Array.from({ length: 80 }, (_, index) => ({
      id: `s${index}`,
      speaker: "Sudenaz",
      text: "x".repeat(80),
      at: "00:10",
    }));

    await generateMeetingReport(
      "8703d8c7-a0b6-4b05-9bb2-1d58aeb4e719",
      segments,
    );

    expect(httpClient.post).toHaveBeenCalledWith(
      getMeetingReportApiUrl("8703d8c7-a0b6-4b05-9bb2-1d58aeb4e719"),
      {},
      { timeout: 120_000, headers: { Authorization: "Bearer firebase-token" } },
    );
  });

  it("generateMeetingReport prefers provider detail message", async () => {
    vi.mocked(httpClient.post).mockRejectedValue(
      createAxiosError({ detail: "invalid api key" }, 401),
    );

    await expect(
      generateMeetingReport("8703d8c7-a0b6-4b05-9bb2-1d58aeb4e719", [
        { id: "s1", speaker: "Ayşe", text: "Merhaba", at: "00:10" },
      ]),
    ).rejects.toThrow("Toplantı raporu oluşturulamadı.");
  });

  it("generateMeetingReport uses fallback message when response has no detail", async () => {
    vi.mocked(httpClient.post).mockRejectedValue(createAxiosError({}, 502));

    await expect(
      generateMeetingReport("8703d8c7-a0b6-4b05-9bb2-1d58aeb4e719", [
        { id: "s1", speaker: "Ayşe", text: "Merhaba", at: "00:10" },
      ]),
    ).rejects.toThrow("Toplantı raporu oluşturulamadı. (502)");
  });
});
