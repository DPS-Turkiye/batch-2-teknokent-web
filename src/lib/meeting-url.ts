const GMEET = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;

export type ParsedMeetingUrl = {
  platform: string;
  nativeMeetingId: string;
};

export function parseMeetingUrl(raw: string): ParsedMeetingUrl | null {
  const input = raw.trim();
  if (!input) return null;
  const lower = input.toLowerCase();
  if (GMEET.test(lower)) {
    return { platform: "google_meet", nativeMeetingId: lower };
  }

  try {
    const uri = new URL(input);
    const host = uri.hostname.toLowerCase();
    if (host.includes("meet.google.com")) {
      const parts = uri.pathname.split("/").filter(Boolean);
      const code = (parts[parts.length - 1] ?? "").toLowerCase();
      if (!GMEET.test(code)) return null;
      return { platform: "google_meet", nativeMeetingId: code };
    }
  } catch {
    return null;
  }
  return null;
}

export function sameMeetingUrl(left?: string | null, right?: string | null) {
  const a = parseMeetingUrl(left ?? "");
  const b = parseMeetingUrl(right ?? "");
  if (a && b) {
    return (
      a.platform === b.platform && a.nativeMeetingId === b.nativeMeetingId
    );
  }
  const normalizedLeft = (left ?? "").trim();
  const normalizedRight = (right ?? "").trim();
  return Boolean(normalizedLeft) && normalizedLeft === normalizedRight;
}
