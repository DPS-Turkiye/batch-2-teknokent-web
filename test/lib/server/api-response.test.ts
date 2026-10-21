import { AxiosError } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import type { BackendResponse } from "@/lib/server/backend-client";
import { SessionRequiredError } from "@/lib/server/session-error";

const reader = vi.hoisted(() => ({ locale: "tr" as "tr" | "en" }));

// The caller's language comes from the request; here a switch stands in for the cookie.
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const { default: tr } = await import("@/messages/tr.json");
  const { default: en } = await import("@/messages/en.json");
  return {
    getTranslations: async (namespace: string) =>
      createTranslator({
        locale: reader.locale,
        messages: reader.locale === "en" ? en : tr,
        namespace: namespace as never,
      }),
  };
});

afterEach(() => {
  reader.locale = "tr";
});

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
    const response = await apiErrorResponse(new SessionRequiredError(), {
      message: "Dashboard service is unavailable.",
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      code: "SESSION_REQUIRED",
      message: "Etkin oturum bulunamadı.",
    });
  });

  it("writes the session error in the caller's language", async () => {
    reader.locale = "en";

    const response = await apiErrorResponse(new SessionRequiredError(), {
      message: "unused",
    });

    expect(await response.json()).toEqual({
      code: "SESSION_REQUIRED",
      message: "You are not signed in.",
    });
  });
});

describe("apiErrorResponse for a backend that does not answer", () => {
  it("reports a timeout as 504, not a bad gateway", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await apiErrorResponse(
      new AxiosError("timeout of 15000ms exceeded", AxiosError.ECONNABORTED),
      { message: "Aksiyonlar yüklenemedi." },
    );

    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({
      code: "BACKEND_TIMEOUT",
      message: "Aksiyonlar yüklenemedi.",
    });
  });

  it("keeps 502 for a backend that cannot be reached", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await apiErrorResponse(
      new AxiosError("connect ECONNREFUSED", "ECONNREFUSED"),
      { message: "Aksiyonlar yüklenemedi." },
    );

    expect(response.status).toBe(502);
    expect((await response.json()).code).toBe("BACKEND_UNAVAILABLE");
  });
});

describe("apiText", () => {
  it("gives a route's own error text in the caller's language", async () => {
    expect(await apiText("programNameRequired")).toBe("Program adı gerekli.");
    reader.locale = "en";
    expect(await apiText("programNameRequired")).toBe(
      "A program name is required.",
    );
  });
});
