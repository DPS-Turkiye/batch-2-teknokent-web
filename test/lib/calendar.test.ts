import { describe, expect, it } from "vitest";

import {
  DAY_SHORT_LABELS,
  MONTH_LABELS,
  WEEKDAY_SHORT_LABELS,
  hourOf,
  isSameDay,
  timeLabel,
  weekRangeLabel,
} from "@/lib/calendar";

describe("calendar labels", () => {
  it("starts the week on Monday and covers all seven days", () => {
    expect(DAY_SHORT_LABELS).toHaveLength(7);
    expect(DAY_SHORT_LABELS[0]).toBe("Pzt");
    expect(DAY_SHORT_LABELS[6]).toBe("Paz");
  });

  it("exposes the Monday–Friday subset for the mentor grid", () => {
    expect(WEEKDAY_SHORT_LABELS).toEqual(["Pzt", "Sal", "Çar", "Per", "Cum"]);
  });

  it("has twelve months in order", () => {
    expect(MONTH_LABELS).toHaveLength(12);
    expect(MONTH_LABELS[0]).toBe("Ocak");
    expect(MONTH_LABELS[11]).toBe("Aralık");
  });
});

describe("calendar helpers", () => {
  it("reads the local hour from an ISO timestamp", () => {
    const at = new Date(2026, 7, 26, 11, 30);
    expect(hourOf(at.toISOString())).toBe(11);
  });

  it("formats a time label", () => {
    const at = new Date(2026, 7, 26, 9, 5);
    expect(timeLabel(at.toISOString())).toBe("09:05");
  });

  it("matches only the same calendar day", () => {
    const day = new Date(2026, 7, 26);
    const sameDayLater = new Date(2026, 7, 26, 23, 0);
    const nextDay = new Date(2026, 7, 27, 1, 0);

    expect(isSameDay(sameDayLater.toISOString(), day)).toBe(true);
    expect(isSameDay(nextDay.toISOString(), day)).toBe(false);
  });

  it("takes the month from the end of a week that spans two months", () => {
    expect(weekRangeLabel(new Date(2026, 7, 31), new Date(2026, 8, 4))).toBe(
      "31–4 Eylül",
    );
  });
});
