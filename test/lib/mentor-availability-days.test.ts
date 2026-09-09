import { describe, expect, it } from "vitest";

import {
  assignPreferredTime,
  availabilityColumns,
  hasThreeHalfHourTimes,
  isHalfOrFullHour,
  slotDayLabel,
  timeFromStartsAt,
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

describe("preferred half-hour times", () => {
  it("accepts only full or half hours", () => {
    expect(isHalfOrFullHour("10:00")).toBe(true);
    expect(isHalfOrFullHour("10:30")).toBe(true);
    expect(isHalfOrFullHour("10:15")).toBe(false);
    expect(isHalfOrFullHour("09:45")).toBe(false);
  });

  it("requires three distinct valid times", () => {
    expect(hasThreeHalfHourTimes(["10:00", "10:30", "14:00"])).toBe(true);
    expect(hasThreeHalfHourTimes(["10:00", "10:15", "14:00"])).toBe(false);
    expect(hasThreeHalfHourTimes(["10:00", "10:00", "14:00"])).toBe(false);
    expect(hasThreeHalfHourTimes(["10:00", "10:30", ""])).toBe(false);
  });

  it("fills empty preferred slots and toggles an existing time", () => {
    expect(assignPreferredTime(["", "", ""], "10:00")).toEqual([
      "10:00",
      "",
      "",
    ]);
    expect(assignPreferredTime(["10:00", "11:00", ""], "14:00")).toEqual([
      "10:00",
      "11:00",
      "14:00",
    ]);
    expect(assignPreferredTime(["10:00", "11:00", "14:00"], "10:00")).toEqual([
      "",
      "11:00",
      "14:00",
    ]);
    expect(assignPreferredTime(["10:00", "11:00", "14:00"], "16:00")).toEqual([
      "10:00",
      "11:00",
      "16:00",
    ]);
  });

  it("reads HH:mm from a slot start", () => {
    const at = new Date("2026-09-08T10:30:00");
    expect(timeFromStartsAt(at.toISOString())).toBe(
      `${String(at.getHours()).padStart(2, "0")}:${String(
        at.getMinutes(),
      ).padStart(2, "0")}`,
    );
  });
});
