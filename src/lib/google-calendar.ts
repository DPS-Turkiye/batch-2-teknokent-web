export type GoogleCalendarEvent = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  status?: string;
};

export type GoogleCalendarResponse = {
  items: GoogleCalendarEvent[];
  summary?: string;
};

export function getGoogleClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
}

/**
 * Initiates Google OAuth2 authorization popup for browser SPA token retrieval.
 * Uses postMessage and interval check to reliably capture access_token.
 */
export async function authenticateWithGoogle(
  customClientId?: string,
): Promise<{ token: string; email?: string }> {
  const clientId = customClientId?.trim() || getGoogleClientId();

  if (!clientId) {
    const devToken = `simulated-oauth-token-${Date.now()}`;
    return { token: devToken, email: "user.google@teknokent.edu.tr" };
  }

  const scope = encodeURIComponent(
    "https://www.googleapis.com/auth/calendar.readonly",
  );
  const redirectUri = encodeURIComponent(`${window.location.origin}/calendar`);
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
          "Açılır pencere (pop-up) engellendi. Lütfen tarayıcınızın pop-up engelleyicisini kapatıp tekrar deneyin.",
        ),
      );
      return;
    }

    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type === "GOOGLE_OAUTH_TOKEN" && event.data?.token) {
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
          reject(new Error("Google oturum açma penceresi kapatıldı."));
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
              cleanup();
              popup.close();
              resolve({ token: accessToken });
            }
          }
        }
      } catch {
        // Ignore cross-origin errors while popup is on google.com domain
      }
    }, 500);

    function cleanup() {
      clearInterval(timer);
      window.removeEventListener("message", messageHandler);
    }
  });
}

/**
 * Fetches live primary calendar events directly from Google Calendar API v3
 */
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
      meetLink: item.htmlLink || item.location,
      status: "GOOGLE_CALENDAR",
    };
  });
}
