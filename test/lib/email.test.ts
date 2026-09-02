import { describe, expect, it } from "vitest";

import { EMAIL_TURKISH_CHAR_MESSAGE, emailCharacterError } from "@/lib/email";

describe("emailCharacterError", () => {
  it("accepts an ASCII address", () => {
    expect(emailCharacterError("gulse@dongu.co")).toBeNull();
  });

  it("rejects Turkish dotted and undotted letters in the address", () => {
    expect(emailCharacterError("süde@gmail.com")).toBe(
      EMAIL_TURKISH_CHAR_MESSAGE,
    );
    expect(emailCharacterError("sude@gmaıl.com")).toBe(
      EMAIL_TURKISH_CHAR_MESSAGE,
    );
  });
});
