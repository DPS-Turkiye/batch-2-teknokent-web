import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createGoogleMeetEvent,
  ensureGoogleCalendarToken,
  parseGoogleMeetLink,
} from "@/lib/google-calendar";

describe("ensureGoogleCalendarToken", () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
  });

  it("refuses to mint a Meet token without a Google client id", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "");

    await expect(ensureGoogleCalendarToken()).rejects.toThrow(
      /NEXT_PUBLIC_GOOGLE_CLIENT_ID/,
    );
  });
});

describe("createGoogleMeetEvent", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not invent a Meet URL for the simulated oauth token", async () => {
    await expect(
      createGoogleMeetEvent({
        accessToken: "simulated-oauth-token-1",
        title: "Mentorluk",
        startIso: "2026-09-04T10:00:00.000Z",
        durationMinutes: 60,
      }),
    ).rejects.toThrow(/NEXT_PUBLIC_GOOGLE_CLIENT_ID/);
  });

  it("creates a Calendar event with Meet and returns hangoutLink", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        hangoutLink: "https://meet.google.com/abc-defg-hij",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const link = await createGoogleMeetEvent({
      accessToken: "ya29.access",
      title: "Mentor: Nihan Öztürk",
      startIso: "2026-09-04T10:00:00.000Z",
      durationMinutes: 45,
    });

    expect(link).toBe("https://meet.google.com/abc-defg-hij");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer ya29.access",
        }),
      }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
      conferenceData: {
        createRequest: { conferenceSolutionKey: { type: string } };
      };
      end: { dateTime: string };
    };
    expect(body.conferenceData.createRequest.conferenceSolutionKey.type).toBe(
      "hangoutsMeet",
    );
    expect(body.end.dateTime).toBe("2026-09-04T10:45:00.000Z");
  });
});

describe("parseGoogleMeetLink", () => {
  it("accepts a meet.google.com URL and rejects other hosts", () => {
    expect(parseGoogleMeetLink("https://meet.google.com/aaa-bbbb-ccc")).toBe(
      "https://meet.google.com/aaa-bbbb-ccc",
    );
    expect(parseGoogleMeetLink("https://example.com/not-meet")).toBeNull();
    expect(parseGoogleMeetLink("")).toBeNull();
  });
});
