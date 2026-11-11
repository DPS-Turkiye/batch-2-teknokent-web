import { NextRequest, NextResponse } from "next/server";
import { vi } from "vitest";

import type { BackendResponse } from "@/lib/server/backend-client";

/** What a `lib/api` function answers after asking the backend. */
export function backendResponse<T>(data: T, status = 200): BackendResponse<T> {
  return { data, headers: {}, status };
}

/** The body the backend sends with a refusal. */
export type BackendRefusalBody = { code?: string; message?: string };

/**
 * What a `lib/api` function answers when the backend refuses. `BackendResponse<T>` types `data`
 * as the success body whatever the status, so the refusal's body is cast to it here, in one place.
 */
export function backendRefusal<T>(
  status: number,
  body: BackendRefusalBody = { code: "BACKEND_REFUSED" },
): BackendResponse<T> {
  const data: unknown = body;
  return { data: data as T, headers: {}, status };
}

/** Any `lib/api` function: it asks the backend and answers what came back. */
type BackendCall = (...args: never[]) => Promise<BackendResponse>;

/**
 * Makes each mocked `lib/api` function answer the same response, for routes that only pass
 * the backend's answer through and whose tests check what was asked.
 */
export function answerEachWith(
  calls: readonly BackendCall[],
  response: BackendResponse = backendResponse({}),
) {
  for (const call of calls) vi.mocked(call).mockResolvedValue(response);
}

/** What a `require*Session` guard answers when it turns the caller away. */
export function guardRefusal(status: 401 | 403) {
  const code = status === 401 ? "SESSION_REQUIRED" : "FORBIDDEN";
  return {
    ok: false as const,
    response: NextResponse.json({ code, message: code }, { status }),
  };
}

/** A request that carries `body` as JSON and, when given, a Firebase ID token as its bearer. */
export function tokenRequest(
  url: string,
  options: { method: string; token?: string; body?: unknown },
) {
  return new NextRequest(url, {
    method: options.method,
    headers: options.token ? { Authorization: `Bearer ${options.token}` } : {},
    body: options.body === undefined ? null : JSON.stringify(options.body),
  });
}
