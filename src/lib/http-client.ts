import axios, { AxiosError } from "axios";

import { ClientApiError, ClientErrorCode } from "@/lib/client/api";

/**
 * Most calls are small JSON round trips through the app's own route handlers.
 * Without a timeout a stalled request never settles, so a screen waiting on one
 * stays on its pending state indefinitely — the reported "Gönderiliyor…" that
 * never resolves. The server-side wrapper already uses 60s for the Next→Spring
 * hop; this covers browser→Next.
 */
export const REQUEST_TIMEOUT_MS = 30_000;

/** Uploads carry a PDF of up to 50 MB, which legitimately outlasts the default. */
export const UPLOAD_TIMEOUT_MS = 120_000;

export const httpClient = axios.create({
  headers: {
    Accept: "application/json",
  },
  timeout: REQUEST_TIMEOUT_MS,
  validateStatus: () => true,
});

/**
 * `validateStatus` lets every HTTP status through to `requireSuccess`, so the
 * only rejections left here are transport failures: a timeout, an aborted
 * request, or no network at all. Axios words those for developers ("timeout of
 * 30000ms exceeded"); this turns them into something a user can act on.
 */
httpClient.interceptors.response.use(undefined, (error: unknown) => {
  if (error instanceof AxiosError) {
    if (
      error.code === AxiosError.ECONNABORTED ||
      error.code === AxiosError.ETIMEDOUT
    ) {
      throw new ClientApiError(
        "İstek zaman aşımına uğradı. Bağlantını kontrol edip tekrar dene.",
        0,
        ClientErrorCode.Timeout,
      );
    }
    if (error.code === AxiosError.ERR_NETWORK) {
      throw new ClientApiError(
        "Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.",
        0,
        ClientErrorCode.Network,
      );
    }
  }
  throw error;
});
