import { isIP } from "node:net";
import "server-only";

/** The backend's per-visitor budgets (team code check and join) key on this header. */
export const CLIENT_ADDRESS_HEADER = "X-Menton-Client-Address";

function ipOrNull(value: string | null | undefined): string | null {
  const address = value?.trim().replace(/^\[|\]$/g, "") ?? "";
  return isIP(address) ? address : null;
}

/**
 * The visitor's address as this server saw it, for a per-visitor limit on the backend (which only sees this
 * server). CloudFront writes `CloudFront-Viewer-Address` itself ("ip:port"), so it is preferred; the first
 * `X-Forwarded-For` entry is the caller's own claim and only a fallback. A value the browser sent as
 * `X-Menton-Client-Address` is never read. Only an IP literal is passed on; the backend checks it again and also
 * keeps a budget shared by everyone, so a forged address cannot lift the total.
 */
export function clientAddress(headers: Headers): string | null {
  const viewer = headers.get("cloudfront-viewer-address")?.trim();
  if (viewer) {
    const port = viewer.lastIndexOf(":");
    return ipOrNull(port > 0 ? viewer.slice(0, port) : viewer);
  }
  const forwarded = ipOrNull(headers.get("x-forwarded-for")?.split(",")[0]);
  return forwarded ?? ipOrNull(headers.get("x-real-ip"));
}

/** The header naming the visitor for a backend call, or none when there is no usable address. */
export function clientAddressHeaders(
  address: string | null,
): Record<string, string> {
  return address ? { [CLIENT_ADDRESS_HEADER]: address } : {};
}
