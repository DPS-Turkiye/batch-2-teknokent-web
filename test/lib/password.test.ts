import { describe, expect, it } from "vitest";

import { passwordStrengthError } from "@/lib/password";

describe("passwordStrengthError", () => {
  it("stays quiet while the field is empty", () => {
    expect(passwordStrengthError("")).toBeNull();
  });

  it("requires eight characters, mixed case, a digit, and a symbol", () => {
    expect(passwordStrengthError("kisa")).toMatch(/en az 8 karakter/);
    expect(passwordStrengthError("sifre1234")).toMatch(/büyük harf/);
    expect(passwordStrengthError("SIFRE1234")).toMatch(/küçük harf/);
    expect(passwordStrengthError("Sifresifre")).toMatch(/rakam/);
    expect(passwordStrengthError("Sifre1234")).toMatch(/özel karakter/);
    expect(passwordStrengthError("Sifre1234!")).toBeNull();
  });
});
