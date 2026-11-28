/** HTTP Content-Disposition. Non-ASCII names go in filename* (RFC 5987). */
export function contentDispositionHeader(
  type: "inline" | "attachment",
  filename: string,
) {
  const raw = filename.trim() || "document";
  const ascii = Array.from(raw, (ch) => {
    const code = ch.charCodeAt(0);
    if (ch === '"' || ch === "\\" || ch === "\n" || ch === "\r") return "_";
    return code >= 0x20 && code <= 0x7e ? ch : "_";
  }).join("");
  const encoded = encodeURIComponent(raw).replace(
    /[!'()*]/g,
    (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `${type}; filename="${ascii || "document"}"; filename*=UTF-8''${encoded}`;
}

/**
 * The file name an attachment's Content-Disposition header gives (filename* first, as RFC 6266 says), or null when
 * the header is missing (a cross-origin response hides it unless the server exposes it) or names nothing.
 */
export function attachmentFilename(header: unknown): string | null {
  if (typeof header !== "string") return null;
  const extended = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header);
  if (extended?.[1]) {
    try {
      return decodeURIComponent(extended[1].trim());
    } catch {
      // A malformed escape falls through to the plain name.
    }
  }
  const plain = /filename\s*=\s*"([^"]*)"|filename\s*=\s*([^;]+)/i.exec(header);
  const name = (plain?.[1] ?? plain?.[2] ?? "").trim();
  return name || null;
}
