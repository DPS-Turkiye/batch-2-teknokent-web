import { describe, expect, it } from "vitest";

import {
  assignPreferredSlot,
  availabilityColumns,
  formatPreferredSlot,
  hasThreePreferredSlots,
  isHalfOrFullHour,
  isValidPreferredSlot,
  parsePreferredSlotsFromMessage,
  preferredSlotsMessageLines,
  requestOutcomeFromMessage,
  slotDayLabel,
  slotFromStartsAt,
  timeFromStartsAt,
  upcomingPreferenceDays,
} from "@/lib/mentor-availability-days";
import type { MentorAvailabilitySlot } from "@/interfaces/mentor";

function slot(
  id: string,
  startsAt: string,
  booked = false,
): MentorAvailabilitySlot {
  return { id, startsAt, durationMinutes: 45, booked };
}

describe("availabilityColumns", () => {
  it("groups free slots into upcoming day columns", () => {
    const now = new Date("2026-09-08T08:00:00");
    const columns = availabilityColumns(
      [
        slot("a", "2026-09-08T10:00:00"),
        slot("b", "2026-09-08T14:00:00"),
        slot("c", "2026-09-09T11:30:00"),
        slot("booked", "2026-09-08T16:00:00", true),
      ],
      now,
    );

    expect(columns).toHaveLength(2);
    expect(columns[0]?.label).toBe(slotDayLabel("2026-09-08T10:00:00"));
    expect(columns[0]?.slots.map((item) => item.id)).toEqual(["a", "b"]);
    expect(columns[1]?.slots.map((item) => item.id)).toEqual(["c"]);
  });

  it("skips days without free hours", () => {
    const now = new Date("2026-09-08T08:00:00");
    const columns = availabilityColumns(
      [slot("later", "2026-09-10T09:30:00")],
      now,
    );
    expect(columns).toHaveLength(1);
    expect(columns[0]?.slots[0]?.id).toBe("later");
  });
});

describe("preferred day and time slots", () => {
  it("accepts only full or half hours", () => {
    expect(isHalfOrFullHour("10:00")).toBe(true);
    expect(isHalfOrFullHour("10:30")).toBe(true);
    expect(isHalfOrFullHour("10:15")).toBe(false);
    expect(isHalfOrFullHour("09:45")).toBe(false);
  });

  it("requires a date and a half-hour time", () => {
    expect(isValidPreferredSlot({ date: "2026-09-10", time: "13:00" })).toBe(
      true,
    );
    expect(isValidPreferredSlot({ date: "", time: "13:00" })).toBe(false);
    expect(isValidPreferredSlot({ date: "2026-09-10", time: "13:15" })).toBe(
      false,
    );
  });

  it("requires three distinct day-and-time preferences", () => {
    expect(
      hasThreePreferredSlots([
        { date: "2026-09-10", time: "10:00" },
        { date: "2026-09-10", time: "10:30" },
        { date: "2026-09-11", time: "14:00" },
      ]),
    ).toBe(true);
    expect(
      hasThreePreferredSlots([
        { date: "2026-09-10", time: "10:00" },
        { date: "2026-09-10", time: "10:15" },
        { date: "2026-09-11", time: "14:00" },
      ]),
    ).toBe(false);
    expect(
      hasThreePreferredSlots([
        { date: "2026-09-10", time: "10:00" },
        { date: "2026-09-10", time: "10:00" },
        { date: "2026-09-11", time: "14:00" },
      ]),
    ).toBe(false);
    expect(
      hasThreePreferredSlots([
        { date: "2026-09-10", time: "10:00" },
        { date: "2026-09-11", time: "10:30" },
        { date: "", time: "14:00" },
      ]),
    ).toBe(false);
  });

  it("fills empty preferred slots and toggles an existing day and time", () => {
    const first = { date: "2026-09-10", time: "10:00" };
    const second = { date: "2026-09-10", time: "11:00" };
    const third = { date: "2026-09-11", time: "14:00" };
    const empty = { date: "", time: "" };
    expect(assignPreferredSlot([empty, empty, empty], first)).toEqual([
      first,
      empty,
      empty,
    ]);
    expect(assignPreferredSlot([first, second, empty], third)).toEqual([
      first,
      second,
      third,
    ]);
    expect(assignPreferredSlot([first, second, third], first)).toEqual([
      empty,
      second,
      third,
    ]);
    expect(
      assignPreferredSlot([first, second, third], {
        date: "2026-09-12",
        time: "16:00",
      }),
    ).toEqual([first, second, { date: "2026-09-12", time: "16:00" }]);
  });

  it("formats a preference as weekday and time", () => {
    expect(formatPreferredSlot({ date: "2026-09-10", time: "13:00" })).toBe(
      "10 Eylül Perşembe · 13:00",
    );
  });

  it("lists upcoming days with weekday labels", () => {
    const days = upcomingPreferenceDays(new Date("2026-09-10T08:00:00"), 2);
    expect(days[0]).toEqual({ value: "2026-09-10", label: "10 Perşembe" });
    expect(days[1]?.label).toBe("11 Cuma");
  });

  it("reads local date and HH:mm from a slot start", () => {
    const at = new Date("2026-09-08T10:30:00");
    expect(slotFromStartsAt(at.toISOString())).toEqual({
      date: `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(
        at.getDate(),
      ).padStart(2, "0")}`,
      time: timeFromStartsAt(at.toISOString()),
    });
  });

  it("round-trips preferred slots through the request message", () => {
    const slots = [
      { date: "2026-09-10", time: "13:00" },
      { date: "2026-09-11", time: "10:30" },
      { date: "2026-09-12", time: "14:00" },
    ];
    const message = [
      "MVP önceliklerini netleştirmek istiyoruz.",
      ...preferredSlotsMessageLines(slots),
    ].join("\n");

    expect(requestOutcomeFromMessage(message)).toBe(
      "MVP önceliklerini netleştirmek istiyoruz.",
    );
    expect(parsePreferredSlotsFromMessage(message)).toEqual([
      {
        date: "2026-09-10",
        time: "13:00",
        label: "10 Eylül Perşembe · 13:00",
      },
      { date: "2026-09-11", time: "10:30", label: "11 Eylül Cuma · 10:30" },
      {
        date: "2026-09-12",
        time: "14:00",
        label: "12 Eylül Cumartesi · 14:00",
      },
    ]);
  });
});
