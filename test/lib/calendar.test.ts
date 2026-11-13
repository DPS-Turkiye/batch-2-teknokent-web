import { describe, expect, it } from "vitest";

import {
  CalendarFilter,
  formatWeekdayDate,
  hourOf,
  isSameDay,
  monthGridCells,
  monthLabel,
  placeInLanes,
  startOfWeek,
  timeLabel,
  upcomingHourColumns,
  weekdayName,
  weekDays,
  weekRangeLabel,
} from "@/lib/calendar";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";
import { expectLength, itemAt } from "@test/fixtures/list-assertions";

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

  it("names both months when a week spans two", () => {
    expect(
      weekRangeLabel(new Date(2026, 7, 31), new Date(2026, 8, 4), "tr"),
    ).toMatch(/^31 Ağustos\s–\s4 Eylül$/);
    expect(
      weekRangeLabel(new Date(2026, 8, 14), new Date(2026, 8, 18), "en"),
    ).toMatch(/^September 14\s–\s18$/);
  });

  it("offers selectable hours even when the mentor has no free slots", () => {
    const now = new Date(2026, 8, 2, 12, 30);
    const columns = upcomingHourColumns(now);
    expect(columns.length).toBe(5);
    expect(columns[0]?.slots.some((slot) => slot.getHours() === 13)).toBe(true);
    expect(columns[1]?.slots[0]?.getHours()).toBe(9);
  });
});

describe("shared calendar filter", () => {
  it("has a label for every filter value in both languages", () => {
    for (const value of Object.values(CalendarFilter)) {
      expect(tr.calendar.filters[value]).toBeTruthy();
      expect(en.calendar.filters[value]).toBeTruthy();
    }
  });
});

describe("week and month grid helpers", () => {
  it("starts the week on Monday regardless of the given day", () => {
    const wednesday = new Date(2026, 8, 2); // 2026-09-02 is a Wednesday
    const start = startOfWeek(wednesday);
    expect(start.getDay()).toBe(1);
    expect(start.getDate()).toBe(31);
  });

  it("generates the requested number of consecutive days", () => {
    const start = new Date(2026, 7, 31);
    const days = weekDays(start, 7);
    expectLength(days, 7);
    expect(days[0].getDate()).toBe(31);
    expect(days[6].getDate()).toBe(6);
  });

  it("pads the month grid so the first cell is always a Monday", () => {
    // September 2026 starts on a Tuesday, so one leading cell is expected.
    const cells = monthGridCells(new Date(2026, 8, 15));
    const first = itemAt(cells, 0);
    expect(first.date.getDay()).toBe(1);
    expect(first.inCurrentMonth).toBe(false);
    expect(cells.length % 7).toBe(0);
  });

  it("labels the month in Turkish and English", () => {
    expect(monthLabel(new Date(2026, 8, 15), "tr")).toBe("Eylül 2026");
    expect(monthLabel(new Date(2026, 8, 15), "en")).toBe("September 2026");
  });
});

describe("placeInLanes", () => {
  const grid = { startHour: 9, hours: 9 };
  const at = (hour: number, hours: number) => ({
    start: new Date(2026, 10, 10, Math.floor(hour), (hour % 1) * 60),
    hours,
  });

  it("orders by start, clamps into the grid and side-steps overlaps", () => {
    const placed = placeInLanes(
      [
        { id: "second", ...at(10.5, 1) },
        { id: "first", ...at(10, 1) },
        { id: "early", ...at(7, 3) },
        { id: "tiny", ...at(12, 0) },
      ],
      (item) => ({ start: item.start, hours: item.hours }),
      grid,
    );
    expect(
      placed.map(({ item, top, height, lane, lanes }) => [
        item.id,
        top,
        height,
        lane,
        lanes,
      ]),
    ).toEqual([
      ["early", 0, 3, 0, 3],
      ["first", 1, 1, 1, 3],
      ["second", 1.5, 1, 2, 3],
      ["tiny", 3, 0.75, 0, 1],
    ]);
  });

  it("reuses a lane that has come free instead of stacking on a running block", () => {
    const placed = placeInLanes(
      [
        { id: "long", ...at(9, 3) },
        { id: "short", ...at(9, 1) },
        { id: "middle", ...at(9.5, 1.5) },
        { id: "late", ...at(10.5, 0.5) },
      ],
      (item) => ({ start: item.start, hours: item.hours }),
      grid,
    );
    expect(placed.map(({ item, lane }) => [item.id, lane])).toEqual([
      ["long", 0],
      ["short", 1],
      ["middle", 2],
      ["late", 1],
    ]);
  });
});

describe("weekday labels", () => {
  const thursday = new Date(2026, 10, 12, 14);

  it("names the weekday and the day with its weekday", () => {
    expect(weekdayName(thursday, "tr")).toBe("Perşembe");
    expect(formatWeekdayDate(thursday, "tr")).toBe("12 Kasım Perşembe");
    expect(formatWeekdayDate(thursday, "en")).toBe("Thursday, November 12");
  });
});
