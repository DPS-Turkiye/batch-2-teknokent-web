import { describe, expect, it } from "vitest";

import { meetLinkHref, normalizeMeetLink } from "@/lib/meet-link";

describe("meet-link", () => {
  it("trims optional links and leaves them empty when skipped", () => {
    expect(normalizeMeetLink("  ")).toBe("");
    expect(normalizeMeetLink(" https://meet.google.com/abc ")).toBe(
      "https://meet.google.com/abc",
    );
  });

  it("adds https when a scheme is missing", () => {
    expect(meetLinkHref("meet.google.com/abc")).toBe(
      "https://meet.google.com/abc",
    );
  });
});
