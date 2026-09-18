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
