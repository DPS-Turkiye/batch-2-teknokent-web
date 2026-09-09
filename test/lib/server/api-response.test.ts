import { describe, expect, it } from "vitest";

import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import type { BackendResponse } from "@/lib/server/backend-client";
import { SessionRequiredError } from "@/lib/server/session-error";

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

describe("apiErrorResponse", () => {
  it("maps a missing session to 401 instead of a 502 backend failure", async () => {
    const response = apiErrorResponse(new SessionRequiredError(), {
      message: "Dashboard service is unavailable.",
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      code: "SESSION_REQUIRED",
      message: "Etkin oturum bulunamadı.",
    });
  });
});
