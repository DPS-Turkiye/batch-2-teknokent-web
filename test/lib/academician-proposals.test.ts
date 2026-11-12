import { describe, expect, it } from "vitest";

import { OfficeHoursRequestAction } from "@/interfaces/academician-office-hours";
import { AppointmentStatus } from "@/interfaces/appointment";
import { Weekday } from "@/interfaces/mentor";
import {
  proposableDays,
  proposalPayload,
  toggleProposed,
} from "@/lib/academician-proposals";
import {
  academicianAppointment,
  academicianAvailability,
  academicianRequest,
  halfHour,
} from "@test/fixtures/academician-office-hours";
import { itemAt } from "@test/fixtures/list-assertions";

// Tuesday 10 November 2026, 10:00 in Istanbul.
const NOW = new Date("2026-11-10T07:00:00Z");

function startsOf(days: ReturnType<typeof proposableDays>, index: number) {
  return itemAt(days, index).slots.map((slot) => [
    slot.time.startsAt.slice(11, 16),
    slot.taken,
  ]);
}

describe("proposableDays", () => {
  const source = {
    availability: academicianAvailability(),
    appointments: [
      academicianAppointment({ ...halfHour("2026-11-10T10:30") }),
      academicianAppointment({
        id: "cancelled",
        status: AppointmentStatus.Cancelled,
        ...halfHour("2026-11-10T11:00"),
      }),
    ],
    requests: [
      academicianRequest({
        id: "this",
        requestedTimes: [halfHour("2026-11-12T14:30")],
      }),
      academicianRequest({
        id: "other",
        requestedTimes: [halfHour("2026-11-12T14:00")],
      }),
      academicianRequest({
        id: "offered",
        status: AppointmentStatus.AlternativeProposed,
        proposedTimes: [halfHour("2026-11-12T15:30")],
        allowedActions: [],
      }),
    ],
  };

  const days = proposableDays(source, { now: NOW, excludeRequestId: "this" });

  it("offers the next five weekdays from today when there are no weekend hours", () => {
    expect(days.map((day) => day.day)).toEqual([
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
      "2026-11-16",
    ]);
  });

  it("offers a Saturday the academician has hours on, unless it is a day off", () => {
    const saturday = {
      id: "rule-saturday",
      dayOfWeek: Weekday.Saturday,
      startTime: "10:00",
      endTime: "11:00",
      slotMinutes: 30,
    };
    const base = academicianAvailability();
    const withSaturday = proposableDays(
      {
        ...source,
        availability: { ...base, rules: [...base.rules, saturday] },
      },
      { now: NOW, excludeRequestId: "this" },
    );
    expect(withSaturday.map((day) => day.day)).toEqual([
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
    ]);
    expect(startsOf(withSaturday, 4)).toEqual([
      ["10:00", false],
      ["10:30", false],
    ]);

    const saturdayOff = proposableDays(
      {
        ...source,
        availability: {
          ...base,
          rules: [...base.rules, saturday],
          exceptions: [
            { startsOn: "2026-11-14", endsOn: "2026-11-14", reason: null },
          ],
        },
      },
      { now: NOW, excludeRequestId: "this" },
    );
    expect(itemAt(saturdayOff, 4).day).toBe("2026-11-16");
  });

  it("cuts the hours into meeting-long slots, drops the past and marks booked ones", () => {
    expect(startsOf(days, 0)).toEqual([
      ["10:30", true],
      ["11:00", false],
      ["11:30", false],
    ]);
  });

  it("keeps the request's own time free and marks times other requests hold", () => {
    expect(startsOf(days, 2)).toEqual([
      ["14:00", true],
      ["14:30", false],
      ["15:00", false],
      ["15:30", true],
    ]);
  });

  it("disables a day without hours", () => {
    expect(itemAt(days, 1)).toMatchObject({ open: false, slots: [] });
    expect(itemAt(days, 2).open).toBe(true);
  });

  it("steps by the meeting plus the buffer and adds one-off hours", () => {
    const withBuffer = proposableDays(
      {
        ...source,
        appointments: [],
        availability: academicianAvailability({
          meetingBufferMinutes: 15,
          oneOffs: [
            {
              id: "friday",
              startsAt: "2026-11-13T10:00:00+03:00",
              endsAt: "2026-11-13T11:00:00+03:00",
              place: null,
            },
          ],
        }),
      },
      { now: NOW, excludeRequestId: "this" },
    );
    expect(startsOf(withBuffer, 0)).toEqual([
      ["10:45", false],
      ["11:30", false],
    ]);
    expect(startsOf(withBuffer, 3)).toEqual([["10:00", false]]);
  });

  it("offers nothing on a day off", () => {
    const dayOff = proposableDays(
      {
        ...source,
        availability: academicianAvailability({
          exceptions: [
            { startsOn: "2026-11-12", endsOn: "2026-11-12", reason: null },
          ],
        }),
      },
      { now: NOW, excludeRequestId: "this" },
    );
    expect(itemAt(dayOff, 2)).toMatchObject({ open: false, slots: [] });
  });
});

describe("toggleProposed", () => {
  const a = halfHour("2026-11-12T14:00");
  const b = halfHour("2026-11-12T15:00");
  const c = halfHour("2026-11-13T10:00");
  const d = halfHour("2026-11-16T10:00");

  it("adds up to three times and drops a picked one", () => {
    expect(toggleProposed([a, b, c], d)).toEqual([a, b, c]);
    expect(toggleProposed([a, b], b)).toEqual([a]);
    expect(toggleProposed([], a)).toEqual([a]);
  });
});

describe("proposalPayload", () => {
  it("sends the times in order and the note only when there is one", () => {
    const early = halfHour("2026-11-12T14:00");
    const late = halfHour("2026-11-13T10:00");
    expect(proposalPayload([late, early], "  Cuma uygun mu?  ")).toEqual({
      action: OfficeHoursRequestAction.ProposeTimes,
      times: [early, late],
      note: "Cuma uygun mu?",
    });
    expect(proposalPayload([early], "   ")).toEqual({
      action: OfficeHoursRequestAction.ProposeTimes,
      times: [early],
      note: null,
    });
  });
});
