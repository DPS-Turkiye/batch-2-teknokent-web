import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, GET, POST } from "@/app/api/botapi/route";
import {
  createMeetingBot,
  fetchMeetingBotStateBackend,
  stopMeetingBotBackend,
} from "@/lib/botapi";

vi.mock("@/lib/session", () => ({
  getSessionIds: vi
    .fn()
    .mockResolvedValue({ userId: "user-1", organizationId: "org-1" }),
}));
vi.mock("@/lib/botapi", () => ({
  createMeetingBot: vi.fn(),
  fetchMeetingBotStateBackend: vi.fn(),
  stopMeetingBotBackend: vi.fn(),
}));

const bearer = { authorization: "Bearer firebase-token" };

describe("assistant bot API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when meetingUrl is invalid", async () => {
    const request = new NextRequest("http://localhost/api/botapi", {
      method: "POST",
      headers: bearer,
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
      headers: bearer,
      body: JSON.stringify({
        meetingUrl: "https://meet.google.com/abc-defg-hij",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(createMeetingBot).toHaveBeenCalledWith(
      { meetingUrl: "https://meet.google.com/abc-defg-hij" },
      "firebase-token",
    );
  });

  it("answers a localized 409 when every recording slot is taken", async () => {
    vi.mocked(createMeetingBot).mockResolvedValue({
      data: { detail: "All recording slots are in use." },
      status: 409,
    });

    const response = await POST(
      new NextRequest("http://localhost/api/botapi", {
        method: "POST",
        headers: bearer,
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
        headers: bearer,
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
      { method: "DELETE", headers: bearer },
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
      { method: "DELETE", headers: bearer },
    );

    const response = await DELETE(request);

    expect(response.status).toBe(204);
    expect(stopMeetingBotBackend).toHaveBeenCalledWith(
      "google_meet",
      "abc-defg-hij",
      "firebase-token",
    );
  });

  it("returns 502 when backend stop call throws", async () => {
    vi.mocked(stopMeetingBotBackend).mockRejectedValue(new Error("boom"));

    const request = new NextRequest(
      "http://localhost/api/botapi?platform=google_meet&nativeMeetingId=abc-defg-hij",
      { method: "DELETE", headers: bearer },
    );

    const response = await DELETE(request);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      code: "BACKEND_UNAVAILABLE",
      message: "Toplantı asistanı hizmetine ulaşılamıyor.",
    });
  });

  it("answers 401 to send or stop a bot without the caller's own token", async () => {
    const send = await POST(
      new NextRequest("http://localhost/api/botapi", {
        method: "POST",
        body: JSON.stringify({
          meetingUrl: "https://meet.google.com/abc-defg-hij",
        }),
      }),
    );
    const stop = await DELETE(
      new NextRequest(
        "http://localhost/api/botapi?platform=google_meet&nativeMeetingId=abc-defg-hij",
        { method: "DELETE" },
      ),
    );

    expect(send.status).toBe(401);
    expect(stop.status).toBe(401);
    expect(createMeetingBot).not.toHaveBeenCalled();
    expect(stopMeetingBotBackend).not.toHaveBeenCalled();
  });

  it("answers a localized 404 to send a bot to a link with no meeting", async () => {
    vi.mocked(createMeetingBot).mockResolvedValue({
      data: { message: "Meeting not found." },
      status: 404,
    });

    const response = await POST(
      new NextRequest("http://localhost/api/botapi", {
        method: "POST",
        headers: bearer,
        body: JSON.stringify({
          meetingUrl: "https://meet.google.com/zzz-zzzz-zzz",
        }),
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      code: "NOT_FOUND",
      message:
        "Bu bağlantıya ait bir görüşme bulunamadı. Asistan yalnızca takvimdeki görüşmeler için kullanılabilir.",
    });
  });

  it("answers a localized 403 to stop the bot of a meeting the caller is not part of", async () => {
    vi.mocked(stopMeetingBotBackend).mockResolvedValue({
      data: {
        message: "Only a participant of this meeting can use its assistant.",
      },
      status: 403,
    });

    const response = await DELETE(
      new NextRequest(
        "http://localhost/api/botapi?platform=google_meet&nativeMeetingId=abc-defg-hij",
        { method: "DELETE", headers: bearer },
      ),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("returns the bot's state for a meeting", async () => {
    const state = {
      platform: "google_meet",
      nativeMeetingId: "abc-defg-hij",
      state: "WAITING_FOR_ADMISSION",
      endReason: null,
      requestedAt: "2026-11-11T20:03:06Z",
    };
    vi.mocked(fetchMeetingBotStateBackend).mockResolvedValue({
      data: state,
      status: 200,
    });

    const response = await GET(
      new NextRequest(
        "http://localhost/api/botapi?platform=google_meet&nativeMeetingId=abc-defg-hij",
        { headers: bearer },
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(state);
    expect(fetchMeetingBotStateBackend).toHaveBeenCalledWith(
      "google_meet",
      "abc-defg-hij",
      "firebase-token",
    );
  });

  it("returns 400 when the state query is incomplete", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/botapi?platform=google_meet", {
        headers: bearer,
      }),
    );

    expect(response.status).toBe(400);
    expect(fetchMeetingBotStateBackend).not.toHaveBeenCalled();
  });

  it("answers 401 to read a bot's state without the caller's own token", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/botapi?platform=google_meet&nativeMeetingId=abc-defg-hij",
      ),
    );

    expect(response.status).toBe(401);
    expect(fetchMeetingBotStateBackend).not.toHaveBeenCalled();
  });

  it("answers a localized 403 for the bot of a meeting the caller is not part of", async () => {
    vi.mocked(fetchMeetingBotStateBackend).mockResolvedValue({
      data: {
        message: "Only a participant of this meeting can use its assistant.",
      },
      status: 403,
    });

    const response = await GET(
      new NextRequest(
        "http://localhost/api/botapi?platform=google_meet&nativeMeetingId=abc-defg-hij",
        { headers: bearer },
      ),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("returns 502 when the state call throws", async () => {
    vi.mocked(fetchMeetingBotStateBackend).mockRejectedValue(new Error("boom"));

    const response = await GET(
      new NextRequest(
        "http://localhost/api/botapi?platform=google_meet&nativeMeetingId=abc-defg-hij",
        { headers: bearer },
      ),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      code: "BACKEND_UNAVAILABLE",
      message: "Toplantı asistanı hizmetine ulaşılamıyor.",
    });
  });
});
