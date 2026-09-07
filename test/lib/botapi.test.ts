import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createMeetingBot,
  generateMeetingReportBackend,
  stopMeetingBotBackend,
} from "@/lib/botapi";
import { fetchMeetingTranscript } from "@/lib/transcriptapi";
import { backendRequest } from "@/lib/server/backend-client";

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

    const result = await createMeetingBot({
      meetingUrl: "https://meet.google.com/abc-defg-hij",
    });

    expect(backendRequest).toHaveBeenCalledWith(
      {
        method: "POST",
        url: "/api/assistant/bots",
        data: { meetingUrl: "https://meet.google.com/abc-defg-hij" },
      },
      { authenticated: false },
    );
    expect(result).toEqual({ data: { id: "bot-1" }, status: 201 });
  });

  it("stopMeetingBotBackend URL-encodes route parameters", async () => {
    vi.mocked(backendRequest).mockResolvedValue({
      data: null,
      headers: {},
      status: 204,
    });

    const result = await stopMeetingBotBackend("google meet", "id/with/slash");

    expect(backendRequest).toHaveBeenCalledWith(
      {
        method: "DELETE",
        url: "/api/assistant/bots/google%20meet/id%2Fwith%2Fslash",
      },
      { authenticated: false },
    );
    expect(result).toEqual({ data: null, status: 204 });
  });

  it("generateMeetingReportBackend forwards body and returns backend status", async () => {
    vi.mocked(backendRequest).mockResolvedValue({
      data: { title: "Meeting" },
      headers: {},
      status: 200,
    });

    const result = await generateMeetingReportBackend(
      "google_meet",
      "abc-defg-hij",
      { model: "gpt-5.4" },
    );

    expect(backendRequest).toHaveBeenCalledWith(
      {
        method: "POST",
        url: "/api/assistant/bots/google_meet/abc-defg-hij/report",
        data: { model: "gpt-5.4" },
        timeout: 120000,
      },
      { authenticated: false },
    );
    expect(result).toEqual({ data: { title: "Meeting" }, status: 200 });
  });

  it("fetchMeetingTranscript URL-encodes parameters", async () => {
    vi.mocked(backendRequest).mockResolvedValue({
      data: { segments: [] },
      headers: {},
      status: 200,
    });

    const result = await fetchMeetingTranscript("google meet", "abc/def");

    expect(backendRequest).toHaveBeenCalledWith(
      {
        method: "GET",
        url: "/api/assistant/transcripts/google%20meet/abc%2Fdef",
      },
      { authenticated: false },
    );
    expect(result).toEqual({ data: { segments: [] }, status: 200 });
  });
});
