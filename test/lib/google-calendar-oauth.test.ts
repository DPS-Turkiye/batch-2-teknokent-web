import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MeetingStatus } from "@/interfaces/meeting";
import {
  authenticateWithGoogle,
  createGoogleMeetEvent,
  ensureGoogleCalendarToken,
  fetchGoogleCalendarEvents,
  getGoogleClientId,
  parseGoogleMeetLink,
  relayGoogleOAuthTokenFromUrl,
} from "@/lib/google-calendar";
import { itemAt } from "@test/fixtures/list-assertions";

const ORIGIN = "http://localhost:9";
const TOKEN_KEY = "metual.googleCalendar.accessToken";
const EXPIRES_KEY = "metual.googleCalendar.expiresAt";

type FakePopup = {
  closed: boolean;
  close: () => void;
  readonly location: { href: string };
};

/** A popup whose page is Google's until `href` is set, so reading its location throws like a cross-origin one. */
function fakePopup() {
  let href: string | null = null;
  const popup: FakePopup = {
    closed: false,
    close: vi.fn(() => {
      popup.closed = true;
    }),
    get location() {
      if (href === null)
        throw new DOMException("cross-origin", "SecurityError");
      return { href };
    },
  };
  return {
    popup,
    redirectTo(url: string) {
      href = url;
    },
  };
}

function openReturns(popup: FakePopup | null) {
  const open = vi.fn<
    (url: string, target: string, features: string) => FakePopup | null
  >(() => popup);
  vi.stubGlobal("open", open);
  return open;
}

function storeToken(token: string, expiresAt: number) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(EXPIRES_KEY, String(expiresAt));
}

function postFromOrigin(origin: string, data: unknown) {
  window.dispatchEvent(new MessageEvent("message", { origin, data }));
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("parseGoogleMeetLink", () => {
  it("rejects blank input and text that is not a URL", () => {
    expect(parseGoogleMeetLink("   ")).toBeNull();
    expect(parseGoogleMeetLink("meet dot google")).toBeNull();
  });

  it("accepts a Meet subdomain and trims the pasted link", () => {
    expect(parseGoogleMeetLink("  https://x.meet.google.com/abc  ")).toBe(
      "https://x.meet.google.com/abc",
    );
  });

  it("rejects a look-alike host that only ends in meet.google.com", () => {
    expect(parseGoogleMeetLink("https://evilmeet.google.com/abc")).toBeNull();
  });
});

describe("getGoogleClientId", () => {
  it("reads the public client id and is empty without one", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "client-1");
    expect(getGoogleClientId()).toBe("client-1");

    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "");
    expect(getGoogleClientId()).toBe("");
  });
});

describe("relayGoogleOAuthTokenFromUrl", () => {
  const close = vi.fn();

  beforeEach(() => {
    close.mockReset();
    vi.stubGlobal("close", close);
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
    Reflect.deleteProperty(window, "opener");
  });

  function setOpener(opener: unknown) {
    Object.defineProperty(window, "opener", {
      configurable: true,
      value: opener,
    });
  }

  it("does nothing on a page that did not come back from Google", () => {
    setOpener({ postMessage: vi.fn() });

    expect(relayGoogleOAuthTokenFromUrl()).toBe(false);
    expect(close).not.toHaveBeenCalled();
  });

  it("hands the token to the opening window and closes the popup", () => {
    const postMessage = vi.fn();
    setOpener({ postMessage });
    window.history.replaceState(
      null,
      "",
      "/callback#access_token=ya29.token&expires_in=3599",
    );

    expect(relayGoogleOAuthTokenFromUrl()).toBe(true);
    expect(postMessage).toHaveBeenCalledWith(
      { type: "GOOGLE_OAUTH_TOKEN", token: "ya29.token", expiresIn: "3599" },
      ORIGIN,
    );
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("stays open when no window opened it", () => {
    setOpener(null);
    window.history.replaceState(null, "", "/callback#access_token=ya29.token");

    expect(relayGoogleOAuthTokenFromUrl()).toBe(false);
    expect(close).not.toHaveBeenCalled();
  });

  it("stays open when the hash names access_token but carries no value", () => {
    setOpener({ postMessage: vi.fn() });
    window.history.replaceState(null, "", "/callback#access_token=");

    expect(relayGoogleOAuthTokenFromUrl()).toBe(false);
  });
});

describe("authenticateWithGoogle", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "client-1");
  });

  it("reuses a stored token that is not about to expire, without a popup", async () => {
    const open = openReturns(null);
    storeToken("stored-token", Date.now() + 10 * 60_000);

    await expect(authenticateWithGoogle()).resolves.toEqual({
      token: "stored-token",
    });
    expect(open).not.toHaveBeenCalled();
  });

  it("drops a stored token that expires within the refresh buffer", async () => {
    const { popup } = fakePopup();
    openReturns(popup);
    storeToken("stale-token", Date.now() + 30_000);

    const pending = authenticateWithGoogle();
    postFromOrigin(ORIGIN, { type: "GOOGLE_OAUTH_TOKEN", token: "fresh" });

    await expect(pending).resolves.toEqual({ token: "fresh" });
  });

  it("answers a simulated token when no client id is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "");
    const open = openReturns(null);

    const result = await authenticateWithGoogle();

    expect(result.token).toMatch(/^simulated-oauth-token-/);
    expect(open).not.toHaveBeenCalled();
  });

  it("opens Google's consent page for the given client id and this page", async () => {
    const { popup } = fakePopup();
    const open = openReturns(popup);

    const pending = authenticateWithGoogle(" custom-client ");
    postFromOrigin(ORIGIN, { type: "GOOGLE_OAUTH_TOKEN", token: "t" });
    await pending;

    const [url] = itemAt(open.mock.calls, 0);
    const consent = new URL(url);
    expect(consent.origin + consent.pathname).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
    expect(consent.searchParams.get("client_id")).toBe("custom-client");
    expect(consent.searchParams.get("redirect_uri")).toBe(`${ORIGIN}/`);
    expect(consent.searchParams.get("response_type")).toBe("token");
    expect(consent.searchParams.get("scope")).toBe(
      "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly",
    );
  });

  it("rejects with a readable message when the popup is blocked", async () => {
    openReturns(null);

    await expect(authenticateWithGoogle()).rejects.toThrow(
      "Açılır pencere engellendi.",
    );
  });

  it("takes the token the popup relays, stores it and closes the popup", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T10:00:00Z"));
    const { popup } = fakePopup();
    openReturns(popup);

    const pending = authenticateWithGoogle();
    postFromOrigin(ORIGIN, {
      type: "GOOGLE_OAUTH_TOKEN",
      token: "relayed",
      expiresIn: "3599",
    });

    await expect(pending).resolves.toEqual({ token: "relayed" });
    expect(popup.close).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(TOKEN_KEY)).toBe("relayed");
    expect(Number(sessionStorage.getItem(EXPIRES_KEY))).toBe(
      Date.parse("2026-03-01T10:00:00Z") + 3_599_000,
    );
  });

  it("ignores messages from other origins and of other shapes", async () => {
    vi.useFakeTimers();
    const { popup } = fakePopup();
    openReturns(popup);
    const settled = vi.fn();

    void authenticateWithGoogle().then(settled, settled);
    postFromOrigin("https://evil.example", {
      type: "GOOGLE_OAUTH_TOKEN",
      token: "stolen",
    });
    postFromOrigin(ORIGIN, { type: "SOMETHING_ELSE", token: "x" });
    postFromOrigin(ORIGIN, "GOOGLE_OAUTH_TOKEN");
    await vi.advanceTimersByTimeAsync(1_000);

    expect(settled).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    popup.close();
    await vi.advanceTimersByTimeAsync(500);
  });

  it("reads the token from the popup once it is back on this origin", async () => {
    vi.useFakeTimers();
    const { popup, redirectTo } = fakePopup();
    openReturns(popup);

    const pending = authenticateWithGoogle();
    await vi.advanceTimersByTimeAsync(500);
    redirectTo(`${ORIGIN}/#access_token=polled&expires_in=120`);
    await vi.advanceTimersByTimeAsync(500);

    await expect(pending).resolves.toEqual({ token: "polled" });
    expect(popup.close).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(TOKEN_KEY)).toBe("polled");
  });

  it("rejects when the user closes the popup, and stops listening", async () => {
    vi.useFakeTimers();
    const { popup } = fakePopup();
    openReturns(popup);

    const failure = authenticateWithGoogle().catch((error: unknown) => error);
    popup.closed = true;
    await vi.advanceTimersByTimeAsync(500);

    await expect(failure).resolves.toMatchObject({
      message: expect.stringMatching(/closed/),
    });

    postFromOrigin(ORIGIN, { type: "GOOGLE_OAUTH_TOKEN", token: "late" });
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("ensureGoogleCalendarToken", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "client-1");
  });

  it("reuses a stored token", async () => {
    storeToken("stored-token", Date.now() + 10 * 60_000);

    await expect(ensureGoogleCalendarToken()).resolves.toEqual({
      token: "stored-token",
    });
  });

  it("signs in with Google when no token is stored", async () => {
    const { popup } = fakePopup();
    openReturns(popup);

    const pending = ensureGoogleCalendarToken();
    postFromOrigin(ORIGIN, { type: "GOOGLE_OAUTH_TOKEN", token: "fresh" });

    await expect(pending).resolves.toEqual({ token: "fresh" });
  });
});

describe("createGoogleMeetEvent", () => {
  const input = {
    accessToken: "ya29.access",
    title: "Mentorluk",
    startIso: "2026-09-04T10:00:00.000Z",
    durationMinutes: 30,
  };

  it("falls back to the video entry point when Google sends no hangoutLink", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          conferenceData: {
            entryPoints: [
              { entryPointType: "phone", uri: "tel:+90-555" },
              { entryPointType: "video", uri: "https://meet.google.com/v" },
            ],
          },
        }),
      ),
    );

    await expect(createGoogleMeetEvent(input)).resolves.toBe(
      "https://meet.google.com/v",
    );
  });

  it("rejects when the event comes back without any Meet link", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ id: "e1" })),
    );

    await expect(createGoogleMeetEvent(input)).rejects.toThrow(
      "Google Meet bağlantısı alınamadı.",
    );
  });

  it("shows Google's own reason when it refuses the event", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ error: { message: "Insufficient Permission" } }, 403),
      ),
    );

    await expect(createGoogleMeetEvent(input)).rejects.toThrow(
      "Insufficient Permission",
    );
  });

  it("shows a readable message when the refusal has no JSON body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html>", { status: 500 })),
    );

    await expect(createGoogleMeetEvent(input)).rejects.toThrow(
      "Google Meet etkinliği oluşturulamadı.",
    );
  });
});

describe("fetchGoogleCalendarEvents", () => {
  it("answers two demo meetings for the simulated token without calling Google", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const events = await fetchGoogleCalendarEvents("simulated-oauth-token-1");

    expect(events).toHaveLength(2);
    expect(
      events.every((event) => event.status === MeetingStatus.GoogleCalendar),
    ).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks for the last 180 days of single events in start order", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-01T00:00:00Z"));
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse({ items: [] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchGoogleCalendarEvents("ya29.access")).resolves.toEqual([]);

    const [url, init] = itemAt(fetchMock.mock.calls, 0);
    if (typeof url !== "string") throw new Error("fetch was not given a URL");
    const query = new URL(url).searchParams;
    expect(query.get("timeMin")).toBe("2026-01-02T00:00:00.000Z");
    expect(query.get("singleEvents")).toBe("true");
    expect(query.get("orderBy")).toBe("startTime");
    expect(init).toEqual({
      headers: {
        Authorization: "Bearer ya29.access",
        Accept: "application/json",
      },
    });
  });

  it("turns Google events into calendar meetings", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          items: [
            {
              id: "timed",
              summary: "Yatırımcı görüşmesi",
              description: "Sunum",
              hangoutLink: "https://meet.google.com/a",
              htmlLink: "https://calendar.google.com/e/1",
              start: { dateTime: "2026-03-02T09:00:00Z" },
              end: { dateTime: "2026-03-02T10:30:00Z" },
            },
            {
              id: "short",
              htmlLink: "https://calendar.google.com/e/2",
              location: "Oda 3",
              start: { dateTime: "2026-03-03T09:00:00Z" },
              end: { dateTime: "2026-03-03T09:05:00Z" },
            },
            {
              id: "open-ended",
              location: "Oda 3",
              start: { date: "2026-03-04" },
            },
          ],
        }),
      ),
    );

    const [timed, short, openEnded] =
      await fetchGoogleCalendarEvents("ya29.access");

    expect(timed).toEqual({
      id: "gcal-timed",
      organizationId: "google-oauth",
      scheduledAt: "2026-03-02T09:00:00.000Z",
      durationMinutes: 90,
      agenda: "Yatırımcı görüşmesi",
      notes: "Sunum",
      meetLink: "https://meet.google.com/a",
      status: MeetingStatus.GoogleCalendar,
    });
    // A five-minute slot still shows as a quarter hour; the calendar link stands in for a Meet link.
    expect(short).toMatchObject({
      durationMinutes: 15,
      agenda: "Google Takvim Etkinliği",
      meetLink: "https://calendar.google.com/e/2",
    });
    // An all-day event with no end starts at 09:00 UTC and lasts the default 45 minutes.
    expect(openEnded).toMatchObject({
      scheduledAt: "2026-03-04T09:00:00.000Z",
      durationMinutes: 45,
      meetLink: "Oda 3",
    });
  });

  it("answers no meetings when Google leaves out the items list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({})),
    );

    await expect(fetchGoogleCalendarEvents("ya29.access")).resolves.toEqual([]);
  });

  it("shows Google's own reason when it refuses the read", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ error: { message: "Invalid Credentials" } }, 401),
      ),
    );

    await expect(fetchGoogleCalendarEvents("ya29.access")).rejects.toThrow(
      "Invalid Credentials",
    );
  });

  it.each([
    ["no JSON body", new Response("<html>", { status: 502 })],
    ["an error without a message", jsonResponse({ error: { code: 500 } }, 500)],
    [
      "an error message that is not text",
      jsonResponse({ error: { message: 7 } }, 500),
    ],
  ])(
    "shows a readable message when the refusal has %s",
    async (_case, response) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => response),
      );

      await expect(fetchGoogleCalendarEvents("ya29.access")).rejects.toThrow(
        "Google Takvim API'sinden takvim verileri çekilemedi.",
      );
    },
  );
});
