import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MentorAvailabilitySlot } from "@/interfaces/mentor";
import {
  assignPreferredSlot,
  availabilityColumns,
  formatPreferredSlot,
  hasPreferredSlots,
  hasProposedSlots,
  isBookableSlot,
  isHalfOrFullHour,
  isValidPreferredSlot,
  parsePreferredSlotsFromMessage,
  parseProposedSlotsFromMessage,
  preferredSlotsMessageLines,
  proposedSlotsMessageLines,
  requestOutcomeFromMessage,
  slotDayLabel,
  slotFromStartsAt,
  slotTimeLabel,
  timeFromStartsAt,
  upcomingPreferenceDays,
} from "@/lib/mentor-availability-days";
import { freezeDate } from "@test/test-utils";

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
  beforeEach(() => {
    freezeDate("2026-09-08T05:00:00");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("needs a new time to be at least four hours away", () => {
    expect(isBookableSlot({ date: "2026-09-08", time: "09:00" })).toBe(true);
    expect(isBookableSlot({ date: "2026-09-08", time: "08:30" })).toBe(false);
    expect(
      hasProposedSlots([
        { date: "2026-09-10", time: "10:00" },
        { date: "2026-09-08", time: "07:00" },
      ]),
    ).toBe(false);
    expect(isValidPreferredSlot({ date: "2026-09-08", time: "07:00" })).toBe(
      true,
    );
  });

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

  it("accepts one to three distinct day-and-time preferences", () => {
    expect(
      hasPreferredSlots([
        { date: "2026-09-10", time: "10:00" },
        { date: "", time: "" },
        { date: "", time: "" },
      ]),
    ).toBe(true);
    expect(
      hasPreferredSlots([
        { date: "2026-09-10", time: "10:00" },
        { date: "2026-09-10", time: "10:30" },
        { date: "", time: "" },
      ]),
    ).toBe(true);
    expect(
      hasPreferredSlots([
        { date: "2026-09-10", time: "10:00" },
        { date: "2026-09-10", time: "10:30" },
        { date: "2026-09-11", time: "14:00" },
      ]),
    ).toBe(true);
    expect(
      hasPreferredSlots([
        { date: "2026-09-10", time: "10:00" },
        { date: "2026-09-10", time: "10:15" },
        { date: "2026-09-11", time: "14:00" },
      ]),
    ).toBe(true);
    expect(
      hasPreferredSlots([
        { date: "2026-09-10", time: "10:00" },
        { date: "2026-09-10", time: "10:00" },
        { date: "2026-09-11", time: "14:00" },
      ]),
    ).toBe(false);
    expect(
      hasPreferredSlots([
        { date: "", time: "" },
        { date: "", time: "" },
        { date: "", time: "" },
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

  it("round-trips mentor proposed slots through the mentor message", () => {
    const slots = [
      { date: "2026-09-12", time: "15:00" },
      { date: "2026-09-13", time: "10:30" },
    ];
    const message = [
      "Saatlerinizi beğenmedim; alternatif gün ve saat öneriyorum.",
      ...proposedSlotsMessageLines(slots),
    ].join("\n");

    expect(hasProposedSlots(slots)).toBe(true);
    expect(parseProposedSlotsFromMessage(message)).toEqual([
      {
        date: "2026-09-12",
        time: "15:00",
        label: "12 Eylül Cumartesi · 15:00",
      },
      { date: "2026-09-13", time: "10:30", label: "13 Eylül Pazar · 10:30" },
    ]);
  });
});

describe("slotTimeLabel", () => {
  it("uses the 24-hour clock in English too", () => {
    const at = new Date(2026, 9, 13, 14, 15).toISOString();
    expect(slotTimeLabel(at, "en")).toBe("14:15");
    expect(slotTimeLabel(at, "tr")).toBe("14:15");
  });
});
