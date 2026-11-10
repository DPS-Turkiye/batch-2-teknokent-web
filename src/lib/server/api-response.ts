import "server-only";

import { AxiosError } from "axios";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import type { BackendResponse } from "@/lib/server/backend-client";
import type messages from "@/messages/tr.json";
import { SessionRequiredError } from "@/lib/server/session-error";

export type ApiTextKey = keyof (typeof messages)["apiErrors"];

/** A route handler's own error text, in the caller's language. */
export async function apiText(key: ApiTextKey) {
  const t = await getTranslations("apiErrors");
  return t(key);
}

export type ApiErrorCode =
  | "BACKEND_TIMEOUT"
  | "BACKEND_UNAVAILABLE"
  | "FORBIDDEN"
  | "INVALID_REQUEST"
  | "NOT_FOUND"
  | "RECORDING_SLOTS_FULL"
  | "SESSION_REQUIRED";

// backendRequest's own timeout: the backend is slow, not unreachable.
function isTimeout(error: unknown) {
  return (
    error instanceof AxiosError &&
    (error.code === AxiosError.ECONNABORTED ||
      error.code === AxiosError.ETIMEDOUT)
  );
}

export function backendResponse(
  response: BackendResponse,
  forwardedHeaders: readonly string[] = [],
) {
  const headers = new Headers({ "Content-Type": "application/json" });
  for (const name of forwardedHeaders) {
    const value = response.headers[name.toLowerCase()];
    if (typeof value === "string") headers.set(name, value);
  }

  if (response.status === 204 || response.status === 304) {
    headers.delete("Content-Type");
    return new NextResponse(null, { status: response.status, headers });
  }

  return NextResponse.json(response.data ?? {}, {
    status: response.status,
    headers,
  });
}

export async function apiErrorResponse(
  error: unknown,
  options: {
    code?: ApiErrorCode;
    message: string;
    status?: number;
  },
) {
  if (error instanceof SessionRequiredError) {
    return NextResponse.json(
      { code: "SESSION_REQUIRED", message: await apiText("sessionMissing") },
      { status: 401 },
    );
  }

  const timedOut = isTimeout(error);
  const code = timedOut
    ? "BACKEND_TIMEOUT"
    : (options.code ?? "BACKEND_UNAVAILABLE");
  const details =
    error instanceof Error
      ? { errorType: error.name, errorMessage: error.message }
      : { errorType: "UnknownError" };
  console.error("Frontend API route failed", { code, ...details });

  return NextResponse.json(
    { code, message: options.message },
    { status: timedOut ? 504 : (options.status ?? 502) },
  );
}
