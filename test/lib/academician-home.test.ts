import { describe, expect, it } from "vitest";

import { AppointmentStatus } from "@/interfaces/appointment";
import {
  daysSince,
  greetingName,
  HOME_REQUEST_PREVIEW,
  homeSummary,
} from "@/lib/academician-home";
import {
  academicianAppointment,
  academicianAvailability,
  academicianRequest,
  halfHour,
} from "@test/fixtures/academician-office-hours";

// Tuesday 10 November 2026, 10:00 in Istanbul.
const NOW = new Date("2026-11-10T07:00:00Z");

describe("homeSummary", () => {
  const requests = [
    academicianRequest({
      id: "newest",
      requestedAt: "2026-11-10T08:00:00+03:00",
    }),
    academicianRequest({
      id: "oldest",
      requestedAt: "2026-11-08T09:00:00+03:00",
    }),
    academicianRequest({
      id: "middle",
      requestedAt: "2026-11-09T09:00:00+03:00",
    }),
    academicianRequest({
      id: "fourth",
      requestedAt: "2026-11-09T12:00:00+03:00",
    }),
    academicianRequest({ id: "asked", awaitingStudentReply: true }),
    academicianRequest({
      id: "proposed",
      status: AppointmentStatus.AlternativeProposed,
    }),
  ];
  const appointments = [
    academicianAppointment({
      id: "later-today",
      ...halfHour("2026-11-10T15:00"),
    }),
    academicianAppointment({
      id: "earlier-today",
      ...halfHour("2026-11-10T09:00"),
    }),
    academicianAppointment({
      id: "cancelled-today",
      status: AppointmentStatus.Cancelled,
    }),
    academicianAppointment({ id: "tomorrow", ...halfHour("2026-11-11T10:00") }),
  ];

  const summary = homeSummary({
    requests,
    appointments,
    availability: academicianAvailability(),
    now: NOW,
  });

  it("counts only the requests waiting for the academician, oldest first", () => {
    expect(summary.pendingCount).toBe(4);
    expect(summary.oldestRequestedAt).toBe("2026-11-08T09:00:00+03:00");
    expect(summary.latestRequests.map((request) => request.id)).toEqual([
      "oldest",
      "middle",
      "fourth",
    ]);
    expect(summary.latestRequests).toHaveLength(HOME_REQUEST_PREVIEW);
  });

  it("lists today's confirmed appointments in time order, past ones included", () => {
    expect(summary.today.map((item) => item.id)).toEqual([
      "earlier-today",
      "later-today",
    ]);
    expect(summary.upcomingCount).toBe(2);
  });

  it("carries the availability figures", () => {
    expect(summary.hasAvailability).toBe(true);
    expect(summary.week.minutes).toBe(240);
    expect(summary.availability).toHaveLength(2);
  });

  it("has no oldest request when nothing waits", () => {
    expect(
      homeSummary({
        requests: [],
        appointments: [],
        availability: academicianAvailability({ rules: [] }),
        now: NOW,
      }),
    ).toMatchObject({
      pendingCount: 0,
      oldestRequestedAt: null,
      hasAvailability: false,
    });
  });
});

describe("daysSince", () => {
  it("counts calendar days, not 24-hour blocks", () => {
    expect(daysSince("2026-11-09T23:30:00+03:00", NOW)).toBe(1);
    expect(daysSince("2026-11-08T09:00:00+03:00", NOW)).toBe(2);
    expect(daysSince("2026-11-10T08:00:00+03:00", NOW)).toBe(0);
  });
});

describe("greetingName", () => {
  it("takes the first given name", () => {
    expect(greetingName("Elif Şahin")).toBe("Elif");
    expect(greetingName("  Ahmet   Öztürk ")).toBe("Ahmet");
  });

  it("has nothing to say without a name", () => {
    expect(greetingName(null)).toBeNull();
    expect(greetingName("   ")).toBeNull();
  });
});
