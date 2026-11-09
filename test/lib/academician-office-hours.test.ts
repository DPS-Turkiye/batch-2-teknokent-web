import { describe, expect, it } from "vitest";

import { rangeMinutes, turkeyTimeRange } from "@/lib/academician-office-hours";
import { formatTimeRange } from "@/lib/utils";

describe("academician Office Hours time helpers", () => {
  it("reads a typed time as Turkey time and keeps the length", () => {
    const range = turkeyTimeRange("2026-12-01T23:45", 30);
    expect(range).toEqual({
      startsAt: "2026-12-01T23:45:00+03:00",
      endsAt: "2026-12-02T00:15:00+03:00",
    });
    expect(rangeMinutes(range)).toBe(30);
  });

  it("formats a range as the start date and time with the end time", () => {
    expect(
      formatTimeRange("2026-12-01T10:00:00+03:00", "2026-12-01T10:30:00+03:00"),
    ).toBe("1 Aralık 2026 10:00 – 10:30");
  });
});
