import { FirebaseError } from "firebase/app";
import { describe, expect, it, vi } from "vitest";

import {
  describeAuthError,
  isEmailVerificationExempt,
} from "@/lib/firebase/auth";

vi.mock("@/lib/firebase/client", () => ({
  firebaseAuth: () => {
    throw new Error("firebaseAuth must not be called by describeAuthError");
  },
  isFirebaseConfigured: () => true,
}));

const TURKISH_BY_CODE: Record<string, string> = {
  "auth/email-already-in-use":
    "Bu e-posta adresiyle kayıtlı bir hesap zaten var.",
  "auth/invalid-email": "E-posta adresi geçersiz.",
  "auth/weak-password": "Şifre çok zayıf. Daha uzun bir şifre seçin.",
  "auth/invalid-credential": "E-posta veya şifre hatalı.",
  "auth/user-not-found": "E-posta veya şifre hatalı.",
  "auth/wrong-password": "E-posta veya şifre hatalı.",
  "auth/too-many-requests":
    "Çok fazla deneme yapıldı. Biraz bekleyip tekrar deneyin.",
  "auth/network-request-failed": "Bağlantı kurulamadı. Tekrar deneyin.",
};

const FALLBACK = "Kimlik doğrulama tamamlanamadı.";

describe("describeAuthError", () => {
  it.each(Object.entries(TURKISH_BY_CODE))(
    "returns the Turkish message for %s",
    (code, expected) => {
      expect(describeAuthError(new FirebaseError(code, "raw sdk text"))).toBe(
        expected,
      );
    },
  );

  it("never leaks the Firebase SDK's own English text for a mapped code", () => {
    for (const code of Object.keys(TURKISH_BY_CODE)) {
      expect(
        describeAuthError(new FirebaseError(code, "The password is invalid.")),
      ).not.toContain("password is invalid");
    }
  });

  it("falls back to Turkish for an unmapped Firebase code", () => {
    expect(describeAuthError(new FirebaseError("auth/unknown", "nope"))).toBe(
      FALLBACK,
    );
  });

  it("passes through a plain Error's own message", () => {
    expect(
      describeAuthError(
        new Error("Oturumunuz sona erdi. Lütfen tekrar giriş yapın."),
      ),
    ).toBe("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
  });

  it("falls back to Turkish for a non-Error value", () => {
    expect(describeAuthError("boom")).toBe(FALLBACK);
    expect(describeAuthError(new Error(""))).toBe(FALLBACK);
  });
});

describe("isEmailVerificationExempt", () => {
  it("allows only the two dummy staff inboxes", () => {
    expect(isEmailVerificationExempt("admin@teknokent.demo")).toBe(true);
    expect(isEmailVerificationExempt("Coordinator@teknokent.demo")).toBe(true);
    expect(isEmailVerificationExempt("gulse@dongu.co")).toBe(false);
    expect(isEmailVerificationExempt("mentor@teknokent.demo")).toBe(false);
  });

  it("does not exempt demo addresses in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    try {
      expect(isEmailVerificationExempt("admin@teknokent.demo")).toBe(false);
      expect(isEmailVerificationExempt("coordinator@teknokent.demo")).toBe(
        false,
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
