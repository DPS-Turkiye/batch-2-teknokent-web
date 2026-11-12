import { describe, expect, it } from "vitest";

import { AppointmentStatus } from "@/interfaces/appointment";
import {
  APPOINTMENT_STATUS_TONE,
  currentTime,
  isUpcoming,
  splitAppointments,
} from "@/lib/appointments";
import {
  APPOINTMENTS_NOW,
  peerAppointment,
  STUDENT_APPOINTMENTS,
} from "@test/fixtures/student-appointments";

describe("splitAppointments", () => {
  it("puts open sessions still ahead first, soonest first, and the rest newest first", () => {
    const { upcoming, past } = splitAppointments(
      STUDENT_APPOINTMENTS,
      APPOINTMENTS_NOW,
    );
    expect(upcoming.map((item) => item.id)).toEqual(["meeting-2", "meeting-1"]);
    expect(past.map((item) => item.id)).toEqual(["meeting-4", "meeting-3"]);
  });

  it("treats a session as upcoming until it ends, and never a cancelled or refused one", () => {
    const now = new Date("2026-11-12T08:30:00.000Z");
    expect(isUpcoming(peerAppointment(), now)).toBe(true);
    expect(
      isUpcoming(peerAppointment(), new Date("2026-11-12T08:45:00.000Z")),
    ).toBe(false);
    for (const status of [
      AppointmentStatus.Cancelled,
      AppointmentStatus.Rejected,
      AppointmentStatus.Expired,
      AppointmentStatus.Withdrawn,
    ]) {
      expect(isUpcoming(peerAppointment({ status }), now)).toBe(false);
    }
    expect(
      isUpcoming(peerAppointment({ status: AppointmentStatus.Pending }), now),
    ).toBe(true);
  });
});

describe("isUpcoming with another time proposed", () => {
  it("keeps the request ahead while the proposed time is, even after the asked-for time passed", () => {
    const request = peerAppointment({
      status: AppointmentStatus.AlternativeProposed,
      startsAt: "2026-11-12T08:00:00.000Z",
      endsAt: "2026-11-12T08:30:00.000Z",
      alternative: {
        startsAt: "2026-11-13T08:00:00.000Z",
        endsAt: "2026-11-13T08:30:00.000Z",
      },
    });
    expect(isUpcoming(request, new Date("2026-11-12T12:00:00.000Z"))).toBe(
      true,
    );
    expect(isUpcoming(request, new Date("2026-11-13T09:00:00.000Z"))).toBe(
      false,
    );
  });
});

describe("currentTime and ordering with another time proposed", () => {
  const moved = peerAppointment({
    id: "moved",
    status: AppointmentStatus.AlternativeProposed,
    startsAt: "2026-11-10T08:00:00.000Z",
    endsAt: "2026-11-10T08:30:00.000Z",
    alternative: {
      startsAt: "2026-11-14T08:00:00.000Z",
      endsAt: "2026-11-14T08:30:00.000Z",
    },
  });
  const sooner = peerAppointment({
    id: "sooner",
    startsAt: "2026-11-12T08:00:00.000Z",
    endsAt: "2026-11-12T08:30:00.000Z",
  });

  it("stands at the proposed time while it is on the table, else at its own", () => {
    expect(currentTime(moved)).toEqual(moved.alternative);
    expect(currentTime(sooner)).toBe(sooner);
  });

  it("sorts by the proposed start, so a passed asked-for time is never first", () => {
    const { upcoming } = splitAppointments(
      [moved, sooner],
      new Date("2026-11-11T09:00:00.000Z"),
    );
    expect(upcoming.map((item) => item.id)).toEqual(["sooner", "moved"]);
  });
});

describe("APPOINTMENT_STATUS_TONE", () => {
  it("never shows a request that is still open in the confirmed colour", () => {
    const confirmed = APPOINTMENT_STATUS_TONE[AppointmentStatus.Confirmed];
    expect(APPOINTMENT_STATUS_TONE[AppointmentStatus.Pending]).not.toBe(
      confirmed,
    );
    expect(
      APPOINTMENT_STATUS_TONE[AppointmentStatus.AlternativeProposed],
    ).not.toBe(confirmed);
  });

  it("covers every status", () => {
    expect(Object.keys(APPOINTMENT_STATUS_TONE).sort()).toEqual(
      Object.values(AppointmentStatus).sort(),
    );
  });
});
