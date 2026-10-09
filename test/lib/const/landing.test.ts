import { describe, expect, it } from "vitest";

import { LANDING_CONTENT } from "@/lib/const/landing";
import { LANDING_CONTENT_EN } from "@/lib/const/landing.en";

/** Strings may differ; keys, list lengths and every non-text value must not. */
function shape(value: unknown): unknown {
  if (typeof value === "string") return "text";
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) =>
        ["href", "photo", "tone", "key", "mock"].includes(key)
          ? [key, item]
          : [key, shape(item)],
      ),
    );
  }
  return value;
}

describe("landing content", () => {
  it("has an English page with the same structure as the Turkish one", () => {
    expect(shape(LANDING_CONTENT_EN)).toEqual(shape(LANDING_CONTENT));
  });

  it("is actually translated", () => {
    expect(LANDING_CONTENT_EN.hero.headline).not.toBe(
      LANDING_CONTENT.hero.headline,
    );
    expect(LANDING_CONTENT_EN.faqs[0].question).toBe(
      "Who can sign in to the platform?",
    );
  });
});
