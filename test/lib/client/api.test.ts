import { describe, expect, it } from "vitest";
import type { AxiosResponse } from "axios";

import { ClientApiError, requireSuccess } from "@/lib/client/api";

function response<T>(status: number, data: T): AxiosResponse<T> {
  return { status, data } as AxiosResponse<T>;
}

describe("requireSuccess", () => {
  it("returns the body on a 2xx", () => {
    expect(requireSuccess(response(200, { id: "1" }))).toEqual({ id: "1" });
  });

  // The backend words its own failures; those must survive untouched.
  it("prefers the backend's message over the fallback", () => {
    expect(() =>
      requireSuccess(
        response(403, { message: "This account is awaiting approval" }),
      ),
    ).toThrow("This account is awaiting approval");
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

  it("never leaks the raw axios wording", () => {
    expect(() => requireSuccess(response(403, ""))).not.toThrow(
      /Request failed with HTTP/,
    );
  });
});
