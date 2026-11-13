import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MeetingBotState } from "@/interfaces/meeting-bot";
import {
  addMeetingBot,
  fetchMeetingBotStatus,
  fetchTranscript,
  generateMeetingReport,
  stopMeetingBot,
} from "@/lib/assistant";
import {
  getBotApiUrl,
  getMeetingBotApiUrl,
  getMeetingReportApiUrl,
  getTranscriptApiUrl,
} from "@/lib/const";
import { currentIdToken } from "@/lib/firebase/auth";
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

vi.mock("@/lib/firebase/auth", () => ({ currentIdToken: vi.fn() }));

const signedIn = { headers: { Authorization: "Bearer firebase-token" } };

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
    vi.mocked(currentIdToken).mockResolvedValue("firebase-token");
  });

  it("addMeetingBot posts meeting url and returns data", async () => {
    const payload = {
      id: "bot-1",
      platform: "google_meet",
      nativeMeetingId: "abc-defg-hij",
      status: "joining",
      title: "Mentor Bot",
    };
    vi.mocked(httpClient.post).mockResolvedValue(
      createAxiosResponse(payload, 201),
    );

    const result = await addMeetingBot("https://meet.google.com/abc-defg-hij");

    expect(httpClient.post).toHaveBeenCalledWith(
      getBotApiUrl(),
      { meetingUrl: "https://meet.google.com/abc-defg-hij" },
      signedIn,
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

    const result = await fetchTranscript("google_meet", "abc-defg-hij");

    expect(httpClient.get).toHaveBeenCalledWith(
      getTranscriptApiUrl("google_meet", "abc-defg-hij"),
      signedIn,
    );
    expect(result).toEqual(segments);
  });

  it("fetchTranscript throws on error status", async () => {
    vi.mocked(httpClient.get).mockRejectedValue(
      createAxiosError({ detail: "missing" }, 404),
    );

    await expect(
      fetchTranscript("google_meet", "abc-defg-hij"),
    ).rejects.toThrow("missing");
  });

  it("stopMeetingBot calls delete with generated url", async () => {
    vi.mocked(httpClient.delete).mockResolvedValue(
      createAxiosResponse({}, 204),
    );

    await stopMeetingBot("google_meet", "abc-defg-hij");

    expect(httpClient.delete).toHaveBeenCalledWith(
      getMeetingBotApiUrl("google_meet", "abc-defg-hij"),
      signedIn,
    );
  });

  it("stopMeetingBot uses fallback message on network failures", async () => {
    vi.mocked(httpClient.delete).mockRejectedValue(new AxiosError("Network"));

    await expect(stopMeetingBot("google_meet", "abc-defg-hij")).rejects.toThrow(
      "Toplantı asistanı durdurulamadı. (ağ hatası)",
    );
  });

  it("generateMeetingReport posts no transcript or model and returns the report", async () => {
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

    const result = await generateMeetingReport("google_meet", "abc-defg-hij");

    expect(httpClient.post).toHaveBeenCalledWith(
      getMeetingReportApiUrl("google_meet", "abc-defg-hij"),
      undefined,
      { timeout: 120_000, ...signedIn },
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
      generateMeetingReport("google_meet", "abc-defg-hij"),
    ).rejects.toThrow(/CloudFront tarafından engellendi/);
  });

  it("generateMeetingReport prefers provider detail message", async () => {
    vi.mocked(httpClient.post).mockRejectedValue(
      createAxiosError({ detail: "invalid api key" }, 401),
    );

    await expect(
      generateMeetingReport("google_meet", "abc-defg-hij"),
    ).rejects.toThrow("Toplantı raporu oluşturulamadı.");
  });

  it("generateMeetingReport uses fallback message when response has no detail", async () => {
    vi.mocked(httpClient.post).mockRejectedValue(createAxiosError({}, 502));

    await expect(
      generateMeetingReport("google_meet", "abc-defg-hij"),
    ).rejects.toThrow("Toplantı raporu oluşturulamadı. (502)");
  });

  it("asks to sign in again and sends nothing without a Firebase session", async () => {
    vi.mocked(currentIdToken).mockResolvedValue(null);

    await expect(
      fetchTranscript("google_meet", "abc-defg-hij"),
    ).rejects.toThrow("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
    await expect(
      generateMeetingReport("google_meet", "abc-defg-hij"),
    ).rejects.toThrow("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
    expect(httpClient.get).not.toHaveBeenCalled();
    expect(httpClient.post).not.toHaveBeenCalled();
  });

  it("fetchMeetingBotStatus reads the bot's state with the caller's token", async () => {
    vi.mocked(httpClient.get).mockResolvedValue(
      createAxiosResponse(
        {
          platform: "google_meet",
          nativeMeetingId: "abc-defg-hij",
          state: "ACTIVE",
          endReason: null,
          requestedAt: "2026-11-11T20:03:06Z",
        },
        200,
      ),
    );

    await expect(
      fetchMeetingBotStatus("google_meet", "abc-defg-hij"),
    ).resolves.toMatchObject({ state: MeetingBotState.Active });
    expect(httpClient.get).toHaveBeenCalledWith(
      getMeetingBotApiUrl("google_meet", "abc-defg-hij"),
      signedIn,
    );
  });

  it("fetchMeetingBotStatus refuses an answer that is not a bot state", async () => {
    vi.mocked(httpClient.get).mockResolvedValue(
      createAxiosResponse({ segments: [] }, 200),
    );

    await expect(
      fetchMeetingBotStatus("google_meet", "abc-defg-hij"),
    ).rejects.toThrow("Botun durumu okunamadı.");
  });

  it("fetchMeetingBotStatus hides the backend's English error", async () => {
    vi.mocked(httpClient.get).mockRejectedValue(
      createAxiosError({ detail: "Failed to read bot state" }, 502),
    );

    await expect(
      fetchMeetingBotStatus("google_meet", "abc-defg-hij"),
    ).rejects.toThrow("Botun durumu okunamadı. (502)");
  });
});
