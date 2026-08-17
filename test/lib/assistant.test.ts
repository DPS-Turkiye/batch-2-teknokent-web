import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { addMeetingBot, fetchTranscript } from "@/lib/assistant";
import { getBotApiUrl, getTranscriptApiUrl } from "@/lib/const";
import { httpClient } from "@/lib/http-client";
import { createAxiosResponse } from "@test/fixtures/health";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
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

    expect(httpClient.post).toHaveBeenCalledWith(getBotApiUrl(), {
      meetingUrl: "https://meet.google.com/abc-defg-hij",
    });
    expect(result).toEqual(payload);
  });

  it("addMeetingBot throws on error status", async () => {
    vi.mocked(httpClient.post).mockRejectedValue(
      createAxiosError({ detail: "bad link" }, 400),
    );

    await expect(addMeetingBot("https://zoom.us/j/1")).rejects.toThrow(
      "bad link",
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
});
