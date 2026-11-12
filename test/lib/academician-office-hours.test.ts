import { describe, expect, it } from "vitest";

import { OfficeHoursRequestAction } from "@/interfaces/academician-office-hours";
import { AppointmentStatus } from "@/interfaces/appointment";
import { Weekday } from "@/interfaces/mentor";
import {
  acceptableTime,
  daysBetween,
  groupAppointments,
  rangeMinutes,
  shiftDay,
  slotWhenLabel,
  turkeyDay,
  turkeyTime,
  turkeyTimeRange,
  waitsForAcademician,
  weekdayOfDay,
} from "@/lib/academician-office-hours";
import { formatTimeRange } from "@/lib/utils";
import {
  academicianAppointment,
  academicianRequest,
  halfHour,
} from "@test/fixtures/academician-office-hours";

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

describe("waitsForAcademician", () => {
  it("is true only for a pending request without an open question", () => {
    expect(waitsForAcademician(academicianRequest())).toBe(true);
    expect(
      waitsForAcademician(academicianRequest({ awaitingStudentReply: true })),
    ).toBe(false);
    expect(
      waitsForAcademician(
        academicianRequest({ status: AppointmentStatus.AlternativeProposed }),
      ),
    ).toBe(false);
  });
});

describe("groupAppointments", () => {
  it("splits confirmed appointments around now and keeps cancelled ones apart", () => {
    const now = Date.parse("2026-11-10T07:00:00Z");
    const groups = groupAppointments(
      [
        academicianAppointment({ id: "next", ...halfHour("2026-11-11T10:00") }),
        academicianAppointment({ id: "soon", ...halfHour("2026-11-10T15:00") }),
        academicianAppointment({ id: "done", ...halfHour("2026-11-09T10:00") }),
        academicianAppointment({
          id: "off",
          status: AppointmentStatus.Cancelled,
        }),
      ],
      now,
    );
    expect(groups.upcoming.map((item) => item.id)).toEqual(["soon", "next"]);
    expect(groups.past.map((item) => item.id)).toEqual(["done"]);
    expect(groups.cancelled.map((item) => item.id)).toEqual(["off"]);
  });
});

describe("slotWhenLabel", () => {
  it("names the day and the hours with plain spaces", () => {
    expect(slotWhenLabel(halfHour("2026-11-12T14:00"), "tr")).toBe(
      "12 Kasım, 14:00–14:30",
    );
    expect(slotWhenLabel(halfHour("2026-11-12T14:00"), "en")).toMatch(
      /^November 12, /,
    );
  });
});

describe("Turkey days", () => {
  it("counts a moment on its Turkey day, whatever the browser's zone", () => {
    // 22:30 in Istanbul on the 10th is still the 10th in UTC, but 21:30 UTC is already the 11th in Istanbul.
    expect(turkeyDay("2026-11-10T22:30:00+03:00")).toBe("2026-11-10");
    expect(turkeyDay(new Date("2026-11-10T21:30:00Z"))).toBe("2026-11-11");
  });

  it("steps and measures days across a month end", () => {
    expect(shiftDay("2026-11-30", 1)).toBe("2026-12-01");
    expect(shiftDay("2026-03-01", -1)).toBe("2026-02-28");
    expect(daysBetween("2026-11-28", "2026-12-02")).toBe(4);
  });

  it("names a day's weekday with the week starting on Monday", () => {
    expect(weekdayOfDay("2026-11-09")).toBe(Weekday.Monday);
    expect(weekdayOfDay("2026-11-15")).toBe(Weekday.Sunday);
  });
});

describe("acceptableTime", () => {
  it("gives the one requested time when accepting is allowed", () => {
    const time = halfHour("2026-11-17T11:00");
    expect(
      acceptableTime(academicianRequest({ requestedTimes: [time] })),
    ).toEqual(time);
  });

  it("waits for a choice among several times, and gives nothing without Accept", () => {
    expect(
      acceptableTime(
        academicianRequest({
          requestedTimes: [
            halfHour("2026-11-17T11:00"),
            halfHour("2026-11-18T11:00"),
          ],
        }),
      ),
    ).toBeNull();
    expect(
      acceptableTime(
        academicianRequest({
          allowedActions: [OfficeHoursRequestAction.Decline],
        }),
      ),
    ).toBeNull();
    expect(
      acceptableTime(academicianRequest({ requestedTimes: [] })),
    ).toBeNull();
  });
});

describe("turkeyTime", () => {
  it("shows a moment in Turkey time", () => {
    expect(turkeyTime("2026-11-10T07:00:00Z", "tr")).toBe("10:00");
  });
});
