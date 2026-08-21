import { describe, expect, it } from "vitest";

import { backendResponse } from "@/lib/server/api-response";
import type { BackendResponse } from "@/lib/server/backend-client";

function fakeResponse<T>(
  status: number,
  data: T,
  headers: Record<string, string> = {},
): BackendResponse<T> {
  return { status, data, headers };
}

describe("backendResponse", () => {
  it("forwards a normal JSON body as-is", async () => {
    const response = backendResponse(fakeResponse(200, { ok: true }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("returns a bodyless response for 204 No Content instead of throwing", () => {
    // NextResponse.json(...) on a 204 status throws per the Fetch spec (a
    // 204/304 response must not carry a body). This is the fix for the
    // DELETE /api/mentor-profile/availability/{id} route returning a 502
    // even though the backend correctly returned 204.
    expect(() => backendResponse(fakeResponse(204, ""))).not.toThrow();

    const response = backendResponse(fakeResponse(204, ""));
    expect(response.status).toBe(204);
    expect(response.body).toBeNull();
  });

  it("returns a bodyless response for 304 Not Modified", () => {
    expect(() => backendResponse(fakeResponse(304, ""))).not.toThrow();

    const response = backendResponse(fakeResponse(304, ""));
    expect(response.status).toBe(304);
    expect(response.body).toBeNull();
  });
});
