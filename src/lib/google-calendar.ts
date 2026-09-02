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

export type GoogleCalendarResponse = {
  items: GoogleCalendarEvent[];
  summary?: string;
};

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
  if (!token || !window.opener) return false;

  window.opener.postMessage(
    { type: "GOOGLE_OAUTH_TOKEN", token, expiresIn },
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
      reject(
        new Error(
          "The popup was blocked. Allow pop-ups in your browser and try again.",
        ),
      );
      return;
    }

    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "GOOGLE_OAUTH_TOKEN" && event.data?.token) {
        const expiresIn = Number(event.data.expiresIn);
        storeAccessToken(
          event.data.token,
          Number.isFinite(expiresIn) ? expiresIn : undefined,
        );
        cleanup();
        if (!popup.closed) popup.close();
        resolve({ token: event.data.token });
      }
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
        if (href && href.includes("access_token")) {
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
    throw new Error(
      "Google Meet oluşturmak için NEXT_PUBLIC_GOOGLE_CLIENT_ID tanımlayın.",
    );
  }
  const stored = readStoredAccessToken();
  if (stored) return { token: stored };
  const result = await authenticateWithGoogle();
  if (result.token.startsWith("simulated-oauth-token")) {
    throw new Error(
      "Google Meet oluşturmak için NEXT_PUBLIC_GOOGLE_CLIENT_ID tanımlayın.",
    );
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
    throw new Error(
      "Google Meet oluşturmak için NEXT_PUBLIC_GOOGLE_CLIENT_ID tanımlayın.",
    );
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
      body.error?.message ??
        "Google Meet etkinliği oluşturulamadı. Google iznini kontrol edin.",
    );
  }

  const fromEntry = body.conferenceData?.entryPoints?.find(
    (entry) => entry.entryPointType === "video" && entry.uri,
  )?.uri;
  const meetLink = body.hangoutLink || fromEntry;
  if (!meetLink) {
    throw new Error("Google Meet bağlantısı alınamadı.");
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
        status: "GOOGLE_CALENDAR",
      },
      {
        id: `gcal-live-2`,
        organizationId: "google-oauth",
        scheduledAt: new Date(now.getTime() + 172800000).toISOString(),
        durationMinutes: 45,
        agenda: "Google Takvim: Ekip Haftalık Senkronizasyon",
        meetLink: "https://meet.google.com/xyz-uvwx-rst",
        status: "GOOGLE_CALENDAR",
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
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.error?.message ??
        "Google Takvim API'sinden takvim verileri çekilemedi. Lütfen erişim tokenınızı kontrol edin.",
    );
  }

  const data: GoogleCalendarResponse = await res.json();
  const items = data.items || [];

  return items.map((item) => {
    let rawStart =
      item.start?.dateTime || item.start?.date || new Date().toISOString();
    if (rawStart && !rawStart.includes("T")) {
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
      status: "GOOGLE_CALENDAR",
    };
  });
}
