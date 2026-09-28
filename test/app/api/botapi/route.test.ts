import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, POST } from "@/app/api/botapi/route";
import { createMeetingBot, stopMeetingBotBackend } from "@/lib/botapi";

vi.mock("@/lib/botapi", () => ({
  createMeetingBot: vi.fn(),
  stopMeetingBotBackend: vi.fn(),
}));

describe("assistant bot API route", () => {
  const headers = { authorization: "Bearer test-token" };
  const sessionId = "8703d8c7-a0b6-4b05-9bb2-1d58aeb4e719";
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when meetingUrl is invalid", async () => {
    const request = new NextRequest("http://localhost/api/botapi", {
      method: "POST",
      headers,
      body: JSON.stringify({ meetingUrl: "not-a-url" }),
    });
    expect((await POST(request)).status).toBe(400);
    expect(createMeetingBot).not.toHaveBeenCalled();
  });

  it("requires a bearer token", async () => {
    const request = new NextRequest("http://localhost/api/botapi", {
      method: "POST",
      body: JSON.stringify({
        meetingUrl: "https://meet.google.com/abc-defg-hij",
      }),
    });
    expect((await POST(request)).status).toBe(401);
  });

  it("forwards valid add-bot requests and token", async () => {
    vi.mocked(createMeetingBot).mockResolvedValue({
      data: { assistantSessionId: sessionId },
      status: 201,
    });
    const request = new NextRequest("http://localhost/api/botapi", {
      method: "POST",
      headers,
      body: JSON.stringify({
        meetingUrl: "https://meet.google.com/abc-defg-hij",
      }),
    });
    expect((await POST(request)).status).toBe(201);
    expect(createMeetingBot).toHaveBeenCalledWith(
      { meetingUrl: "https://meet.google.com/abc-defg-hij" },
      "test-token",
    );
  });

  it("rejects malformed session IDs", async () => {
    const request = new NextRequest(
      "http://localhost/api/botapi?sessionId=bad",
      { method: "DELETE", headers },
    );
    expect((await DELETE(request)).status).toBe(400);
    expect(stopMeetingBotBackend).not.toHaveBeenCalled();
  });

  it("forwards stop by opaque session ID", async () => {
    vi.mocked(stopMeetingBotBackend).mockResolvedValue({
      data: null,
      status: 204,
    });
    const request = new NextRequest(
      `http://localhost/api/botapi?sessionId=${sessionId}`,
      { method: "DELETE", headers },
    );
    expect((await DELETE(request)).status).toBe(204);
    expect(stopMeetingBotBackend).toHaveBeenCalledWith(sessionId, "test-token");
  });
});
