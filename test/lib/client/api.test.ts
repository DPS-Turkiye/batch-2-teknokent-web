import { describe, expect, it } from "vitest";
import type { AxiosResponse } from "axios";

import { ClientApiError, requireSuccess } from "@/lib/client/api";
import { clientTextsIn } from "@test/client-texts";

function response<T>(status: number, data: T): AxiosResponse<T> {
  return { status, data } as AxiosResponse<T>;
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
      requireSuccess({
        status: 429,
        data: {},
        headers: { "x-rate-limit-retry-after-seconds": "61" },
      } as unknown as AxiosResponse),
    ).toThrow("Too many attempts. Try again in 2 minutes.");
  });

  it("keeps a Turkish backend message", () => {
    expect(() =>
      requireSuccess(response(403, { message: "Hesabınız onay bekliyor." })),
    ).toThrow("Hesabınız onay bekliyor.");
  });

  it("keeps the backend's error code", () => {
    try {
      requireSuccess(
        response(401, {
          message: "No active session.",
          code: "SESSION_REQUIRED",
        }),
      );
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ClientApiError);
      expect((error as ClientApiError).code).toBe("SESSION_REQUIRED");
      expect((error as ClientApiError).status).toBe(401);
    }
  });

  it("keeps field-level validation messages from the backend", () => {
    try {
      requireSuccess(
        response(400, {
          message: "Form validation failed.",
          fieldErrors: { phone: "Telefon numarası geçersiz." },
        }),
      );
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ClientApiError);
      expect((error as ClientApiError).fieldErrors).toEqual({
        phone: "Telefon numarası geçersiz.",
      });
    }
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
    const limited = {
      status: 429,
      data: { message: "" },
      headers: { "x-rate-limit-retry-after-seconds": "125" },
    } as unknown as AxiosResponse;

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
