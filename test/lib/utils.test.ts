import { describe, expect, it } from "vitest";

import { formatLongDate } from "@/lib/utils";

describe("formatLongDate", () => {
  it("writes the day, the Turkish month name and the year", () => {
    expect(formatLongDate("2026-09-02T12:00:00Z")).toBe("2 Eylül 2026");
  });
});
