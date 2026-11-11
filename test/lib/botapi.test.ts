import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createMeetingBot,
  generateMeetingReportBackend,
  stopMeetingBotBackend,
} from "@/lib/botapi";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";
import { fetchMeetingTranscript } from "@/lib/transcriptapi";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

describe("assistant server lib", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createMeetingBot proxies request and status", async () => {
    vi.mocked(backendRequest).mockResolvedValue({
      data: { id: "bot-1" },
      headers: {},
      status: 201,
    });

    const result = await createMeetingBot(
      { meetingUrl: "https://meet.google.com/abc-defg-hij" },
      "firebase-token",
    );

    expect(backendRequest).toHaveBeenCalledWith(
      {
        method: HttpMethod.Post,
        url: "/api/assistant/bots",
        data: { meetingUrl: "https://meet.google.com/abc-defg-hij" },
      },
      { idToken: "firebase-token" },
    );
    expect(result).toEqual({ data: { id: "bot-1" }, status: 201 });
  });

  it("stopMeetingBotBackend URL-encodes route parameters", async () => {
    vi.mocked(backendRequest).mockResolvedValue({
      data: null,
      headers: {},
      status: 204,
    });

    const result = await stopMeetingBotBackend(
      "google meet",
      "id/with/slash",
      "firebase-token",
    );

    expect(backendRequest).toHaveBeenCalledWith(
      {
        method: HttpMethod.Delete,
        url: "/api/assistant/bots/google%20meet/id%2Fwith%2Fslash",
      },
      { idToken: "firebase-token" },
    );
    expect(result).toEqual({ data: null, status: 204 });
  });

  it("generateMeetingReportBackend sends no body, only the caller's token", async () => {
    vi.mocked(backendRequest).mockResolvedValue({
      data: { title: "Meeting" },
      headers: {},
      status: 200,
    });

    const result = await generateMeetingReportBackend(
      "google_meet",
      "abc-defg-hij",
      "firebase-token",
    );

    expect(backendRequest).toHaveBeenCalledWith(
      {
        method: HttpMethod.Post,
        url: "/api/assistant/bots/google_meet/abc-defg-hij/report",
        timeout: 120000,
      },
      { idToken: "firebase-token" },
    );
    expect(result).toEqual({ data: { title: "Meeting" }, status: 200 });
  });

  it("fetchMeetingTranscript URL-encodes parameters", async () => {
    vi.mocked(backendRequest).mockResolvedValue({
      data: { segments: [] },
      headers: {},
      status: 200,
    });

    const result = await fetchMeetingTranscript(
      "google meet",
      "abc/def",
      "firebase-token",
    );

    expect(backendRequest).toHaveBeenCalledWith(
      {
        method: HttpMethod.Get,
        url: "/api/assistant/transcripts/google%20meet/abc%2Fdef",
      },
      { idToken: "firebase-token" },
    );
    expect(result).toEqual({ data: { segments: [] }, status: 200 });
  });
});
