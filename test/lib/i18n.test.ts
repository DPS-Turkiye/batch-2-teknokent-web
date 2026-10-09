import { describe, expect, it } from "vitest";

import { Locale, resolveLocale } from "@/lib/i18n";

describe("resolveLocale", () => {
  it("keeps everyone on Turkish while English is switched off", () => {
    expect(resolveLocale(Locale.En, "en-US,en;q=0.9", false)).toBe(Locale.Tr);
  });

  it("prefers the saved choice, then the browser's first supported language", () => {
    expect(resolveLocale(Locale.Tr, "en-US,en;q=0.9", true)).toBe(Locale.Tr);
    expect(resolveLocale(undefined, "de-DE,en-GB;q=0.8,tr;q=0.5", true)).toBe(
      Locale.En,
    );
    expect(resolveLocale(undefined, "tr-TR,tr;q=0.9,en;q=0.8", true)).toBe(
      Locale.Tr,
    );
  });

  it("falls back to Turkish for an unknown cookie or language", () => {
    expect(resolveLocale("fr", "de-DE", true)).toBe(Locale.Tr);
    expect(resolveLocale(undefined, null, true)).toBe(Locale.Tr);
  });
});
