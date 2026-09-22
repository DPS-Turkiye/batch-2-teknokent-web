import { describe, expect, it } from "vitest";

import {
  calendarDay,
  dayGreeting,
  formatLongDate,
  formatShortDate,
} from "@/lib/utils";

describe("dayGreeting", () => {
  it("follows the time of day", () => {
    expect(dayGreeting(new Date(2026, 8, 14, 9))).toBe("Günaydın");
    expect(dayGreeting(new Date(2026, 8, 14, 14))).toBe("İyi günler");
    expect(dayGreeting(new Date(2026, 8, 14, 21))).toBe("İyi akşamlar");
    expect(dayGreeting(new Date(2026, 8, 14, 3))).toBe("İyi akşamlar");
  });
});

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

describe("calendarDay", () => {
  it("keeps a calendar day on the same day in any time zone", () => {
    const day = calendarDay("2026-09-15");
    expect([day.getFullYear(), day.getMonth(), day.getDate()]).toEqual([
      2026, 8, 15,
    ]);
  });
});
