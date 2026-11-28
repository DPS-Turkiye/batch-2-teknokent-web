import { AxiosError, type RawAxiosResponseHeaders } from "axios";
import { getTranslations } from "next-intl/server";
import { NextResponse } from "next/server";
import "server-only";

import type messages from "@/messages/tr.json";

/** What the backend answered to one of this app's own two routes (health, the unsubscribe link in mail). */
export type BackendResponse<T = unknown> = {
  data: T;
  headers: RawAxiosResponseHeaders;
  status: number;
};

export type ApiTextKey = keyof (typeof messages)["apiErrors"];

/** A route handler's own error text, in the caller's language. */
export async function apiText(key: ApiTextKey) {
  const t = await getTranslations("apiErrors");
  return t(key);
}

// The call's own timeout: the backend is slow, not unreachable.
function isTimeout(error: unknown) {
  return (
    error instanceof AxiosError &&
    (error.code === AxiosError.ECONNABORTED ||
      error.code === AxiosError.ETIMEDOUT)
  );
}

export function backendResponse(response: BackendResponse) {
  if (response.status === 204 || response.status === 304) {
    return new NextResponse(null, { status: response.status });
  }

  return NextResponse.json(response.data ?? {}, { status: response.status });
}

export async function invalidRequest(message: ApiTextKey) {
  return NextResponse.json(
    { code: "INVALID_REQUEST", message: await apiText(message), fields: [] },
    { status: 400 },
  );
}

export function apiErrorResponse(error: unknown, options: { message: string }) {
  const timedOut = isTimeout(error);
  const code = timedOut ? "BACKEND_TIMEOUT" : "BACKEND_UNAVAILABLE";
  const details =
    error instanceof Error
      ? { errorType: error.name, errorMessage: error.message }
      : { errorType: "UnknownError" };
  console.error("Frontend API route failed", { code, ...details });

  return NextResponse.json(
    { code, message: options.message },
    { status: timedOut ? 504 : 502 },
  );
}
