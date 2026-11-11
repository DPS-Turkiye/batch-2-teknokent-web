import { describe, expect, it } from "vitest";

import {
  calendarDay,
  dayPart,
  errorMessage,
  formatFileSize,
  formatLongDate,
  formatShortDate,
  httpUrlOrNull,
  splitFullName,
} from "@/lib/utils";

describe("dayPart", () => {
  it("follows the time of day", () => {
    expect(dayPart(new Date(2026, 8, 14, 9))).toBe("morning");
    expect(dayPart(new Date(2026, 8, 14, 14))).toBe("afternoon");
    expect(dayPart(new Date(2026, 8, 14, 21))).toBe("evening");
    expect(dayPart(new Date(2026, 8, 14, 3))).toBe("evening");
  });
});

describe("formatLongDate", () => {
  it("writes the day, the Turkish month name and the year", () => {
    expect(formatLongDate("2026-09-02T12:00:00Z")).toBe("2 Eylül 2026");
  });

  it("writes the English month name in English", () => {
    expect(formatLongDate("2026-09-02T12:00:00Z", "en")).toBe(
      "September 2, 2026",
    );
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

describe("errorMessage", () => {
  it("returns the thrown message when there is one", () => {
    expect(errorMessage(new Error("Kota doldu."), "fallback")).toBe(
      "Kota doldu.",
    );
  });

  it("falls back when what was thrown is not an Error", () => {
    expect(errorMessage("boom", "Kaydedilemedi.")).toBe("Kaydedilemedi.");
  });
});

describe("formatFileSize", () => {
  it("shows files under a megabyte in kilobytes, never as 0.00 MB", () => {
    expect(formatFileSize(3_300)).toBe("3 KB");
    expect(formatFileSize(200)).toBe("1 KB");
    expect(formatFileSize(300 * 1024)).toBe("300 KB");
  });

  it("shows larger files in megabytes with one decimal", () => {
    expect(formatFileSize(2.34 * 1024 * 1024)).toBe("2.3 MB");
    expect(formatFileSize(10 * 1024 * 1024)).toBe("10 MB");
  });
});

describe("httpUrlOrNull", () => {
  it("keeps http and https links and refuses anything else", () => {
    expect(httpUrlOrNull(" https://www.linkedin.com/in/ada ")).toBe(
      "https://www.linkedin.com/in/ada",
    );
    expect(httpUrlOrNull("http://example.com")).toBe("http://example.com");
    expect(httpUrlOrNull("javascript:alert(1)")).toBeNull();
    expect(httpUrlOrNull("linkedin.com/in/ada")).toBeNull();
    expect(httpUrlOrNull("")).toBeNull();
    expect(httpUrlOrNull(null)).toBeNull();
  });
});

describe("splitFullName", () => {
  it("keeps the last word as the surname", () => {
    expect(splitFullName("  Ayşe Nur   Yılmaz ")).toEqual({
      firstName: "Ayşe Nur",
      lastName: "Yılmaz",
    });
  });

  it("takes a single word as the first name", () => {
    expect(splitFullName("Ayşe")).toEqual({ firstName: "Ayşe", lastName: "" });
    expect(splitFullName("")).toEqual({ firstName: "", lastName: "" });
  });
});
