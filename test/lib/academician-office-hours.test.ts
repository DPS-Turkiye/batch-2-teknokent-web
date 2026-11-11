import { describe, expect, it } from "vitest";

import { AppointmentStatus } from "@/interfaces/appointment";
import {
  groupAppointments,
  rangeMinutes,
  slotWhenLabel,
  turkeyTimeRange,
  waitsForAcademician,
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
