import type { AxiosResponse } from "axios";

import { amplifyBlockedMessage } from "@/lib/amplify-safe-body";

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
      return "Gönderilen bilgiler geçersiz. Alanları kontrol edip tekrar dene.";
    case 401:
      return "Oturumun sona ermiş görünüyor. Tekrar giriş yapıp dene.";
    case 403:
      return "Bu işlem için yetkin yok. Hesabın koordinatör onayında olabilir; onaylandıktan sonra tekrar dene.";
    case 404:
      return "Aradığın kayıt bulunamadı.";
    case 413:
      return "Dosya çok büyük. En fazla 50 MB yükleyebilirsin.";
    case 415:
      return "Bu dosya türü desteklenmiyor. Lütfen PDF yükle.";
    case 429:
      return "Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.";
    default:
      return status >= 500
        ? "Sunucu şu anda yanıt veremiyor. Birazdan tekrar dene."
        : `İşlem tamamlanamadı (HTTP ${status}).`;
  }
}

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
  const looksEnglish =
    /\b(the|a user|could|must|only|not found|already|awaiting|requires?|invalid|failed|provide|this endpoint|is unavailable)\b/i.test(
      message,
    );
  return looksEnglish ? fallbackMessage(status) : message;
}

// The backend's rate limiter says how long to wait; axios lowercases header names.
const RETRY_AFTER_HEADER = "x-rate-limit-retry-after-seconds";

function rateLimitMessage(response: AxiosResponse) {
  const seconds = Number(response.headers?.[RETRY_AFTER_HEADER]);
  if (!Number.isFinite(seconds) || seconds <= 0) return fallbackMessage(429);
  const minutes = Math.ceil(seconds / 60);
  return `Çok fazla deneme yapıldı. ${minutes} dakika sonra tekrar dene.`;
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
