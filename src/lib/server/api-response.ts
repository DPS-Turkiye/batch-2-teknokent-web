import "server-only";

import { NextResponse } from "next/server";

import type { BackendResponse } from "@/lib/server/backend-client";

export type ApiErrorCode =
  "BACKEND_UNAVAILABLE" | "INVALID_REQUEST" | "SESSION_REQUIRED";

export function backendResponse(
  response: BackendResponse,
  forwardedHeaders: readonly string[] = [],
) {
  const headers = new Headers({ "Content-Type": "application/json" });
  for (const name of forwardedHeaders) {
    const value = response.headers[name.toLowerCase()];
    if (typeof value === "string") headers.set(name, value);
  }

  // 204/304 responses must not carry a body per the Fetch spec — NextResponse
  // throws if one is attached, so skip it entirely for those statuses.
  if (response.status === 204 || response.status === 304) {
    return new NextResponse(null, { status: response.status, headers });
  }

  return NextResponse.json(response.data ?? {}, {
    status: response.status,
    headers,
  });
}

export function apiErrorResponse(
  error: unknown,
  options: {
    code?: ApiErrorCode;
    message: string;
    status?: number;
  },
) {
  const details =
    error instanceof Error
      ? { errorType: error.name, errorMessage: error.message }
      : { errorType: "UnknownError" };
  console.error("Frontend API route failed", {
    code: options.code ?? "BACKEND_UNAVAILABLE",
    ...details,
  });

  return NextResponse.json(
    {
      code: options.code ?? "BACKEND_UNAVAILABLE",
      message: options.message,
    },
    { status: options.status ?? 502 },
  );
}
