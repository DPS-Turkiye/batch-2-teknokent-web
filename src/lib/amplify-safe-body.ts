export const AMPLIFY_SAFE_JSON_CHARS = 6_000;

export const AMPLIFY_BLOCKED_MESSAGE =
  "İstek CloudFront tarafından engellendi (403). Transkript gövdesi çok büyük olabilir.";

export function jsonFitsAmplifyWaf(payload: unknown): boolean {
  try {
    return JSON.stringify(payload).length <= AMPLIFY_SAFE_JSON_CHARS;
  } catch {
    return false;
  }
}

export function amplifyBlockedMessage(data: unknown): string | null {
  if (typeof data !== "string") return null;
  const html = data.toLowerCase();
  if (html.includes("cloudfront") || html.includes("403 error")) {
    return AMPLIFY_BLOCKED_MESSAGE;
  }
  return null;
}
