import type { AxiosResponse } from "axios";

import { amplifyBlockedMessage } from "@/lib/amplify-safe-body";
import { UPLOAD_ERROR_MESSAGES } from "@/lib/upload-error-messages";

export class ClientApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
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
      return UPLOAD_ERROR_MESSAGES.tooLarge(50);
    case 415:
      return UPLOAD_ERROR_MESSAGES.unsupportedType("PDF veya DOCX");
    case 422:
      return UPLOAD_ERROR_MESSAGES.suspiciousContent;
    case 429:
      return "Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.";
    default:
      return status >= 500
        ? "Sunucu şu anda yanıt veremiyor. Birazdan tekrar dene."
        : `İşlem tamamlanamadı (HTTP ${status}).`;
  }
}

export function requireSuccess<T>(response: AxiosResponse<T>): T {
  if (response.status >= 200 && response.status < 300) return response.data;
  const body = response.data as unknown;
  const blocked = amplifyBlockedMessage(body);
  const message =
    blocked ??
    (body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
      ? body.message
      : fallbackMessage(response.status));
  const code =
    body &&
    typeof body === "object" &&
    "code" in body &&
    typeof body.code === "string"
      ? body.code
      : undefined;
  throw new ClientApiError(message, response.status, code);
}
