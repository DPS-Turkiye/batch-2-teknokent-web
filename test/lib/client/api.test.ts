import type { AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";

import { ClientApiError, requireSuccess } from "@/lib/client/api";
import { clientTextsIn } from "@test/client-texts";
import { createAxiosResponse } from "@test/fixtures/health";

function response<T>(
  status: number,
  data: T,
  headers: Record<string, string> = {},
): AxiosResponse<T> {
  return { ...createAxiosResponse(data, status), headers };
}

/** What `run` threw; fails the test when it returned instead. */
function errorFrom(run: () => unknown): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  throw new Error("Expected the call to throw");
}

describe("requireSuccess", () => {
  it("returns the body on a 2xx", () => {
    expect(requireSuccess(response(200, { id: "1" }))).toEqual({ id: "1" });
  });

  it("replaces an English backend message with the Turkish fallback", () => {
    expect(() =>
      requireSuccess(
        response(403, { message: "This account is awaiting approval" }),
      ),
    ).toThrow(/yetkin yok/);
  });

  it("words its fallbacks in English when that is the chosen language", () => {
    clientTextsIn("en");
    expect(() => requireSuccess(response(404, {}))).toThrow(
      "The record you are looking for was not found.",
    );
    expect(() =>
      requireSuccess(
        response(429, {}, { "x-rate-limit-retry-after-seconds": "61" }),
      ),
    ).toThrow("Too many attempts. Try again in 2 minutes.");
  });

  it("keeps a Turkish backend message", () => {
    expect(() =>
      requireSuccess(response(403, { message: "Hesabınız onay bekliyor." })),
    ).toThrow("Hesabınız onay bekliyor.");
  });

  it("shows an English reader the server's English message, never a Turkish one", () => {
    clientTextsIn("en");
    expect(() =>
      requireSuccess(
        response(409, {
          message: "This meeting proposal is no longer waiting for an answer.",
        }),
      ),
    ).toThrow("This meeting proposal is no longer waiting for an answer.");
    expect(() =>
      requireSuccess(response(404, { message: "Toplantı bulunamadı." })),
    ).toThrow("The record you are looking for was not found.");
  });

  it("keeps the backend's error code", () => {
    const error = errorFrom(() =>
      requireSuccess(
        response(401, {
          message: "No active session.",
          code: "SESSION_REQUIRED",
        }),
      ),
    );
    expect(error).toBeInstanceOf(ClientApiError);
    expect(error).toMatchObject({ code: "SESSION_REQUIRED", status: 401 });
  });

  it("keeps field-level validation messages from the backend", () => {
    const error = errorFrom(() =>
      requireSuccess(
        response(400, {
          message: "Form validation failed.",
          fieldErrors: { phone: "Telefon numarası geçersiz." },
        }),
      ),
    );
    expect(error).toBeInstanceOf(ClientApiError);
    expect(error).toHaveProperty("fieldErrors", {
      phone: "Telefon numarası geçersiz.",
    });
  });

  // A rejection from an edge proxy carries no JSON body, which is how testers
  // ended up looking at "Request failed with HTTP 403."
  it.each([
    [403, /yetkin yok/],
    [413, /çok büyük/],
    [415, /desteklenmiyor/],
    [429, /Çok fazla deneme/],
    [500, /yanıt veremiyor/],
    [502, /yanıt veremiyor/],
  ])(
    "gives %i an actionable message when the body is empty",
    (status, expected) => {
      expect(() => requireSuccess(response(status, ""))).toThrow(expected);
    },
  );

  it("says how many minutes to wait after too many tries", () => {
    const limited = response(
      429,
      { message: "" },
      { "x-rate-limit-retry-after-seconds": "125" },
    );

    expect(() => requireSuccess(limited)).toThrow(
      "Çok fazla deneme yapıldı. 3 dakika sonra tekrar dene.",
    );
    expect(() => requireSuccess(response(429, { message: "" }))).toThrow(
      "Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.",
    );
  });

  it("falls back when the backend sends an empty message", () => {
    expect(() => requireSuccess(response(404, { message: "  " }))).toThrow(
      "Aradığın kayıt bulunamadı.",
    );
  });

  it("never leaks the raw axios wording", () => {
    expect(() => requireSuccess(response(403, ""))).not.toThrow(
      /Request failed with HTTP/,
    );
  });
});
