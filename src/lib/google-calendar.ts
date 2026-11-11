import { clientText } from "@/i18n/client-texts";
import { MeetingStatus } from "@/interfaces/meeting";

/** The message type the OAuth popup posts its token under. */
const OAUTH_TOKEN_MESSAGE = "GOOGLE_OAUTH_TOKEN";

/** The token the OAuth popup posts back (see relayGoogleOAuthTokenFromUrl), or null for any other message. */
function oauthToken(
  data: unknown,
): { token: string; expiresIn: unknown } | null {
  if (!data || typeof data !== "object") return null;
  if (!("type" in data) || data.type !== OAUTH_TOKEN_MESSAGE) return null;
  if (!("token" in data) || typeof data.token !== "string" || !data.token) {
    return null;
  }
  return {
    token: data.token,
    expiresIn: "expiresIn" in data ? data.expiresIn : undefined,
  };
}

function googleErrorMessage(body: unknown) {
  if (!body || typeof body !== "object" || !("error" in body)) return null;
  const error = body.error;
  if (!error || typeof error !== "object" || !("message" in error)) return null;
  return typeof error.message === "string" ? error.message : null;
}

export type GoogleCalendarEvent = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  hangoutLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  status?: string;
  conferenceData?: {
    entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
  };
};

/** The events of a Calendar API list response; Google's event shape is trusted as documented. */
function calendarEvents(data: unknown): GoogleCalendarEvent[] {
  if (!data || typeof data !== "object" || !("items" in data)) return [];
  const { items } = data;
  return Array.isArray(items) ? (items as GoogleCalendarEvent[]) : [];
}

const ACCESS_TOKEN_KEY = "metual.googleCalendar.accessToken";
const ACCESS_TOKEN_EXPIRES_KEY = "metual.googleCalendar.expiresAt";
const TOKEN_REFRESH_BUFFER_MS = 60_000;

export function parseGoogleMeetLink(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    if (host !== "meet.google.com" && !host.endsWith(".meet.google.com")) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function getGoogleClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
}

function readStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  const expiresAt = Number(
    sessionStorage.getItem(ACCESS_TOKEN_EXPIRES_KEY) ?? 0,
  );
  if (
    !token ||
    !expiresAt ||
    Date.now() >= expiresAt - TOKEN_REFRESH_BUFFER_MS
  ) {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_EXPIRES_KEY);
    return null;
  }
  return token;
}

function storeAccessToken(token: string, expiresInSeconds?: number) {
  if (typeof window === "undefined") return;
  const lifetimeMs = Math.max(60, expiresInSeconds ?? 3600) * 1000;
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  sessionStorage.setItem(
    ACCESS_TOKEN_EXPIRES_KEY,
    String(Date.now() + lifetimeMs),
  );
}

export function relayGoogleOAuthTokenFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  if (!window.location.hash.includes("access_token")) return false;

  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const token = hashParams.get("access_token");
  const expiresIn = hashParams.get("expires_in");
  const opener = window.opener as Window | null;
  if (!token || !opener) return false;

  opener.postMessage(
    { type: OAUTH_TOKEN_MESSAGE, token, expiresIn },
    window.location.origin,
  );
  window.close();
  return true;
}

export async function authenticateWithGoogle(
  customClientId?: string,
): Promise<{ token: string; email?: string }> {
  const stored = readStoredAccessToken();
  if (stored) return { token: stored };

  const clientId = customClientId?.trim() || getGoogleClientId();

  if (!clientId) {
    const devToken = `simulated-oauth-token-${Date.now()}`;
    return { token: devToken, email: "user.google@teknokent.edu.tr" };
  }

  const scope = encodeURIComponent(
    [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
    ].join(" "),
  );
  const redirectUri = encodeURIComponent(
    `${window.location.origin}${window.location.pathname}`,
  );
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&prompt=consent`;

  return new Promise((resolve, reject) => {
    const width = 500;
    const height = 650;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      "Google OAuth2 Oturum Açma",
      `width=${width},height=${height},left=${left},top=${top}`,
    );

    if (!popup) {
      reject(new Error(clientText("googleCalendar.popupBlocked")));
      return;
    }

    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const token = oauthToken(event.data);
      if (!token) return;
      const expiresIn = Number(token.expiresIn);
      storeAccessToken(
        token.token,
        Number.isFinite(expiresIn) ? expiresIn : undefined,
      );
      cleanup();
      if (!popup.closed) popup.close();
      resolve({ token: token.token });
    };

    window.addEventListener("message", messageHandler);

    const timer = setInterval(() => {
      try {
        if (popup.closed) {
          cleanup();
          reject(new Error("The Google sign-in window was closed."));
          return;
        }

        const href = popup.location.href;
        if (href.includes("access_token")) {
          const hashIndex = href.indexOf("#");
          if (hashIndex !== -1) {
            const hashParams = new URLSearchParams(
              href.substring(hashIndex + 1),
            );
            const accessToken = hashParams.get("access_token");
            if (accessToken) {
              const expiresIn = Number(hashParams.get("expires_in"));
              storeAccessToken(
                accessToken,
                Number.isFinite(expiresIn) ? expiresIn : undefined,
              );
              cleanup();
              popup.close();
              resolve({ token: accessToken });
            }
          }
        }
      } catch {}
    }, 500);

    function cleanup() {
      clearInterval(timer);
      window.removeEventListener("message", messageHandler);
    }
  });
}

export async function ensureGoogleCalendarToken(): Promise<{ token: string }> {
  if (!getGoogleClientId()) {
    throw new Error(clientText("googleCalendar.missingClientId"));
  }
  const stored = readStoredAccessToken();
  if (stored) return { token: stored };
  const result = await authenticateWithGoogle();
  if (result.token.startsWith("simulated-oauth-token")) {
    throw new Error(clientText("googleCalendar.missingClientId"));
  }
  return { token: result.token };
}

export async function createGoogleMeetEvent(input: {
  accessToken: string;
  title: string;
  startIso: string;
  durationMinutes: number;
}): Promise<string> {
  if (input.accessToken.startsWith("simulated-oauth-token")) {
    throw new Error(clientText("googleCalendar.missingClientId"));
  }

  const start = new Date(input.startIso);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  const url =
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: input.title,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    }),
  });

  const body = (await res.json().catch(() => ({}))) as GoogleCalendarEvent & {
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(
      body.error?.message ?? clientText("googleCalendar.meetCreateFailed"),
    );
  }

  const fromEntry = body.conferenceData?.entryPoints?.find(
    (entry) => entry.entryPointType === "video" && entry.uri,
  )?.uri;
  const meetLink = body.hangoutLink || fromEntry;
  if (!meetLink) {
    throw new Error(clientText("googleCalendar.meetLinkMissing"));
  }
  return meetLink;
}

export async function fetchGoogleCalendarEvents(accessToken: string) {
  if (accessToken.startsWith("simulated-oauth-token")) {
    const now = new Date();
    return [
      {
        id: `gcal-live-1`,
        organizationId: "google-oauth",
        scheduledAt: new Date(now.getTime() + 86400000).toISOString(),
        durationMinutes: 60,
        agenda: "Google Takvim: Ar-Ge Proje İnceleme",
        meetLink: "https://meet.google.com/abc-defg-hij",
        status: MeetingStatus.GoogleCalendar,
      },
      {
        id: `gcal-live-2`,
        organizationId: "google-oauth",
        scheduledAt: new Date(now.getTime() + 172800000).toISOString(),
        durationMinutes: 45,
        agenda: "Google Takvim: Ekip Haftalık Senkronizasyon",
        meetLink: "https://meet.google.com/xyz-uvwx-rst",
        status: MeetingStatus.GoogleCalendar,
      },
    ];
  }

  const timeMin = new Date(Date.now() - 180 * 86400000).toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=250&singleEvents=true&orderBy=startTime`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errorBody: unknown = await res.json().catch(() => null);
    throw new Error(
      googleErrorMessage(errorBody) ?? clientText("googleCalendar.fetchFailed"),
    );
  }

  const data: unknown = await res.json();

  return calendarEvents(data).map((item) => {
    let rawStart =
      item.start?.dateTime || item.start?.date || new Date().toISOString();
    if (!rawStart.includes("T")) {
      rawStart = `${rawStart}T09:00:00Z`;
    }
    const startIso = new Date(rawStart).toISOString();
    const endIso = item.end?.dateTime || item.end?.date;

    let durationMinutes = 45;
    if (endIso) {
      const s = new Date(startIso).getTime();
      const e = new Date(endIso).getTime();
      durationMinutes = Math.max(15, Math.round((e - s) / 60000));
    }

    return {
      id: `gcal-${item.id}`,
      organizationId: "google-oauth",
      scheduledAt: startIso,
      durationMinutes,
      agenda: item.summary || "Google Takvim Etkinliği",
      notes: item.description,
      meetLink: item.hangoutLink || item.htmlLink || item.location,
      status: MeetingStatus.GoogleCalendar,
    };
  });
}
