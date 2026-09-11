import { describe, expect, it } from "vitest";

import { formatLongDate, formatShortDate } from "@/lib/utils";

describe("formatLongDate", () => {
  it("writes the day, the Turkish month name and the year", () => {
    expect(formatLongDate("2026-09-02T12:00:00Z")).toBe("2 Eylül 2026");
  });
});

describe("formatShortDate", () => {
  it("writes the day, the short Turkish month and the year", () => {
    expect(formatShortDate("2026-09-12T12:00:00Z")).toBe("12 Eyl 2026");
  });
});
