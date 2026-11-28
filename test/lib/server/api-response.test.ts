import { AxiosError } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  apiErrorResponse,
  apiText,
  backendResponse,
  invalidRequest,
} from "@/lib/server/api-response";
import { backendResponse as answer } from "@test/fixtures/route-handlers";
import type { MessageNamespace, TestLocale } from "@test/i18n";

const reader = vi.hoisted((): { locale: TestLocale } => ({ locale: "tr" }));

// The caller's language comes from the request; here a switch stands in for the cookie.
vi.mock("next-intl/server", async () => {
  const { translatorIn } = await import("@test/translators");
  return {
    getTranslations: async <Namespace extends MessageNamespace>(
      namespace: Namespace,
    ) => translatorIn(reader.locale, namespace),
  };
});

afterEach(() => {
  reader.locale = "tr";
});

describe("backendResponse", () => {
  it("forwards a normal JSON body as-is", async () => {
    const response = backendResponse(answer({ ok: true }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("answers an empty JSON object for a body the backend left out", async () => {
    const response = backendResponse(answer(null, 400));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({});
  });

  it.each([204, 304])(
    "returns a bodyless response for %i instead of throwing",
    (status) => {
      const response = backendResponse(answer("", status));

      expect(response.status).toBe(status);
      expect(response.body).toBeNull();
    },
  );
});

describe("invalidRequest", () => {
  it("answers 400 with the route's text in the caller's language", async () => {
    reader.locale = "en";

    const response = await invalidRequest("invalidRequestBody");

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: "INVALID_REQUEST",
      message: "The request body could not be read.",
      fields: [],
    });
  });
});

describe("apiErrorResponse for a backend that does not answer", () => {
  it("reports a timeout as 504, not a bad gateway", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = apiErrorResponse(
      new AxiosError("timeout of 15000ms exceeded", AxiosError.ECONNABORTED),
      { message: "Abonelik iptal edilemedi." },
    );

    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({
      code: "BACKEND_TIMEOUT",
      message: "Abonelik iptal edilemedi.",
    });
  });

  it.each([
    ["a backend that cannot be reached", new AxiosError("x", "ECONNREFUSED")],
    ["a thrown non-error", "boom"],
  ])("keeps 502 for %s", async (_, error) => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = apiErrorResponse(error, { message: "m" });

    expect(response.status).toBe(502);
    expect((await response.json()).code).toBe("BACKEND_UNAVAILABLE");
  });
});

describe("apiText", () => {
  it("gives a route's own error text in the caller's language", async () => {
    expect(await apiText("unsubscribeFailed")).toBe("İşlem tamamlanamadı.");
    reader.locale = "en";
    expect(await apiText("unsubscribeFailed")).toBe("That did not work.");
  });
});
