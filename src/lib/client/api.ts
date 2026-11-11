import type { AxiosResponse } from "axios";

import { clientLocale, clientText } from "@/i18n/client-texts";
import { amplifyBlockedMessage } from "@/lib/amplify-safe-body";
import { Locale } from "@/lib/i18n";

/** Codes this app gives failures that never reached a route handler; other codes come from the backend. */
export const ClientErrorCode = {
  Timeout: "TIMEOUT",
  Network: "NETWORK",
} as const;

export class ClientApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ClientApiError";
  }
}

/**
 * A failure that never reached the application still has to say something a
 * user can act on. An edge proxy rejecting an upload, an expired session, or a
 * request that is simply too large all arrive with no JSON body at all, and
 * "Request failed with HTTP 403." leaves the user with nowhere to go.
 */
function fallbackMessage(status: number) {
  switch (status) {
    case 400:
      return clientText("http400");
    case 401:
      return clientText("http401");
    case 403:
      return clientText("http403");
    case 404:
      return clientText("http404");
    case 413:
      return clientText("http413");
    case 415:
      return clientText("http415");
    case 429:
      return clientText("http429");
    default:
      return status >= 500
        ? clientText("http5xx")
        : clientText("httpOther", { status });
  }
}

const ENGLISH_WORDS =
  /\b(the|a user|could|must|only|not found|already|awaiting|requires?|invalid|failed|provide|this endpoint|is unavailable)\b/i;
const TURKISH_LETTERS = /[çğıöşüÇĞİÖŞÜ]/;

function visibleServerMessage(body: unknown, status: number) {
  if (
    !body ||
    typeof body !== "object" ||
    !("message" in body) ||
    typeof body.message !== "string"
  ) {
    return fallbackMessage(status);
  }
  const message = body.message.trim();
  if (!message) return fallbackMessage(status);
  // Only a message in the reader's language is shown: a Turkish reader never gets the backend's English
  // developer texts, an English reader never gets a Turkish text that missed translation.
  const foreign =
    clientLocale() === Locale.En
      ? TURKISH_LETTERS.test(message)
      : ENGLISH_WORDS.test(message);
  return foreign ? fallbackMessage(status) : message;
}

// The backend's rate limiter says how long to wait; axios lowercases header names.
const RETRY_AFTER_HEADER = "x-rate-limit-retry-after-seconds";

function rateLimitMessage(response: AxiosResponse) {
  const seconds = Number(response.headers[RETRY_AFTER_HEADER]);
  if (!Number.isFinite(seconds) || seconds <= 0) return fallbackMessage(429);
  const minutes = Math.ceil(seconds / 60);
  return clientText("rateLimit", { minutes });
}

export function requireSuccess<T>(response: AxiosResponse<T>): T {
  if (response.status >= 200 && response.status < 300) return response.data;
  const body = response.data as unknown;
  const blocked = amplifyBlockedMessage(body);
  const message =
    blocked ??
    (response.status === 429
      ? rateLimitMessage(response)
      : visibleServerMessage(body, response.status));
  const code =
    body &&
    typeof body === "object" &&
    "code" in body &&
    typeof body.code === "string"
      ? body.code
      : undefined;
  const fieldErrors =
    body &&
    typeof body === "object" &&
    "fieldErrors" in body &&
    body.fieldErrors &&
    typeof body.fieldErrors === "object"
      ? (body.fieldErrors as Record<string, string>)
      : {};
  throw new ClientApiError(message, response.status, code, fieldErrors);
}
