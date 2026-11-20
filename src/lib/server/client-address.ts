import "server-only";

/**
 * The visitor's address as this server saw it, for a per-visitor limit on the backend (which only sees this
 * server). CloudFront writes `CloudFront-Viewer-Address` itself ("ip:port"), so it is preferred; the first
 * `X-Forwarded-For` entry is the caller's own claim and only a fallback. The backend validates the value and also
 * keeps a budget shared by everyone, so a forged address cannot lift the total.
 */
export function clientAddress(headers: Headers): string | null {
  const viewer = headers.get("cloudfront-viewer-address")?.trim();
  if (viewer) {
    const port = viewer.lastIndexOf(":");
    const address = port > 0 ? viewer.slice(0, port) : viewer;
    return address.replace(/^\[|\]$/g, "") || null;
  }
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return headers.get("x-real-ip")?.trim() || null;
}
