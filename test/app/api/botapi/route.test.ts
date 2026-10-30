import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, POST } from "@/app/api/botapi/route";
import { createMeetingBot, stopMeetingBotBackend } from "@/lib/botapi";

vi.mock("@/lib/session", () => ({
  getSessionIds: vi
    .fn()
    .mockResolvedValue({ userId: "user-1", organizationId: "org-1" }),
}));
vi.mock("@/lib/botapi", () => ({
  createMeetingBot: vi.fn(),
  stopMeetingBotBackend: vi.fn(),
}));

describe("assistant bot API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when meetingUrl is invalid", async () => {
    const request = new NextRequest("http://localhost/api/botapi", {
      method: "POST",
      body: JSON.stringify({ meetingUrl: "not-a-url" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(createMeetingBot).not.toHaveBeenCalled();
  });

  it("forwards valid add-bot requests", async () => {
    vi.mocked(createMeetingBot).mockResolvedValue({
      data: { id: "bot-1" },
      status: 201,
    });

    const request = new NextRequest("http://localhost/api/botapi", {
      method: "POST",
      body: JSON.stringify({
        meetingUrl: "https://meet.google.com/abc-defg-hij",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(createMeetingBot).toHaveBeenCalledWith({
      meetingUrl: "https://meet.google.com/abc-defg-hij",
    });
  });

  it("answers a localized 409 when every recording slot is taken", async () => {
    vi.mocked(createMeetingBot).mockResolvedValue({
      data: { detail: "All recording slots are in use." },
      status: 409,
    });

    const response = await POST(
      new NextRequest("http://localhost/api/botapi", {
        method: "POST",
        body: JSON.stringify({
          meetingUrl: "https://meet.google.com/abc-defg-hij",
        }),
      }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      code: "RECORDING_SLOTS_FULL",
      message: expect.any(String),
    });
  });

  it("passes on any other 409 from the backend unchanged", async () => {
    vi.mocked(createMeetingBot).mockResolvedValue({
      data: { detail: "Failed to reach meeting provider" },
      status: 409,
    });

    const response = await POST(
      new NextRequest("http://localhost/api/botapi", {
        method: "POST",
        body: JSON.stringify({
          meetingUrl: "https://meet.google.com/abc-defg-hij",
        }),
      }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      detail: "Failed to reach meeting provider",
    });
  });

  it("returns 400 when delete query is incomplete", async () => {
    const request = new NextRequest(
      "http://localhost/api/botapi?platform=google_meet",
      { method: "DELETE" },
    );

    const response = await DELETE(request);

    expect(response.status).toBe(400);
    expect(stopMeetingBotBackend).not.toHaveBeenCalled();
  });

  it("returns 204 when backend stop call returns 204", async () => {
    vi.mocked(stopMeetingBotBackend).mockResolvedValue({
      data: null,
      status: 204,
    });

    const request = new NextRequest(
      "http://localhost/api/botapi?platform=google_meet&nativeMeetingId=abc-defg-hij",
      { method: "DELETE" },
    );

    const response = await DELETE(request);

    expect(response.status).toBe(204);
    expect(stopMeetingBotBackend).toHaveBeenCalledWith(
      "google_meet",
      "abc-defg-hij",
    );
  });

  it("returns 502 when backend stop call throws", async () => {
    vi.mocked(stopMeetingBotBackend).mockRejectedValue(new Error("boom"));

    const request = new NextRequest(
      "http://localhost/api/botapi?platform=google_meet&nativeMeetingId=abc-defg-hij",
      { method: "DELETE" },
    );

    const response = await DELETE(request);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      code: "BACKEND_UNAVAILABLE",
      message: "Toplantı asistanı hizmetine ulaşılamıyor.",
    });
  });
});
