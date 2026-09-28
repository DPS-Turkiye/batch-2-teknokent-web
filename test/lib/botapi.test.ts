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

    const result = await createMeetingBot(
      { meetingUrl: "https://meet.google.com/abc-defg-hij" },
      "verified-token",
    );

    expect(backendRequest).toHaveBeenCalledWith(
      {
        method: "POST",
        url: "/api/assistant/sessions",
        data: { meetingUrl: "https://meet.google.com/abc-defg-hij" },
      },
      { idToken: "verified-token" },
    );
    expect(result).toEqual({ data: { id: "bot-1" }, status: 201 });
  });

  it("stopMeetingBotBackend uses the opaque session ID", async () => {
    vi.mocked(backendRequest).mockResolvedValue({
      data: null,
      headers: {},
      status: 204,
    });

    const result = await stopMeetingBotBackend("session-1", "verified-token");

    expect(backendRequest).toHaveBeenCalledWith(
      {
        method: "DELETE",
        url: "/api/assistant/sessions/session-1",
      },
      { idToken: "verified-token" },
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
      "session-1",
      { model: "gpt-5.4" },
      "verified-token",
    );

    expect(backendRequest).toHaveBeenCalledWith(
      {
        method: "POST",
        url: "/api/assistant/sessions/session-1/report",
        data: { model: "gpt-5.4" },
        timeout: 120000,
      },
      { idToken: "verified-token" },
    );
    expect(result).toEqual({ data: { title: "Meeting" }, status: 200 });
  });

  it("fetchMeetingTranscript uses the opaque session ID", async () => {
    vi.mocked(backendRequest).mockResolvedValue({
      data: { segments: [] },
      headers: {},
      status: 200,
    });

    const result = await fetchMeetingTranscript("session-1", "verified-token");

    expect(backendRequest).toHaveBeenCalledWith(
      {
        method: "GET",
        url: "/api/assistant/sessions/session-1/transcript",
      },
      { idToken: "verified-token" },
    );
    expect(result).toEqual({ data: { segments: [] }, status: 200 });
  });
});
