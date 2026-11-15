import { describe, expect, it } from "vitest";

import {
  AppointmentKind,
  AppointmentSide,
  AppointmentStatus,
} from "@/interfaces/appointment";
import {
  appointmentReportHref,
  matchesAppointmentRole,
} from "@/lib/iskur-appointments";
import { AppointmentRoleFilter } from "@/types/iskur-appointments";
import { peerAppointment } from "@test/fixtures/student-appointments";

describe("matchesAppointmentRole", () => {
  const asMentor = { side: AppointmentSide.Mentor };
  const asMentee = { side: AppointmentSide.Mentee };

  it("keeps everything under Tümü", () => {
    expect(matchesAppointmentRole(asMentor, AppointmentRoleFilter.All)).toBe(
      true,
    );
    expect(matchesAppointmentRole(asMentee, AppointmentRoleFilter.All)).toBe(
      true,
    );
  });

  it("keeps only the student's own side under Mentor olarak and Mentee olarak", () => {
    expect(
      matchesAppointmentRole(asMentor, AppointmentRoleFilter.AsMentor),
    ).toBe(true);
    expect(
      matchesAppointmentRole(asMentee, AppointmentRoleFilter.AsMentor),
    ).toBe(false);
    expect(
      matchesAppointmentRole(asMentee, AppointmentRoleFilter.AsMentee),
    ).toBe(true);
    expect(
      matchesAppointmentRole(asMentor, AppointmentRoleFilter.AsMentee),
    ).toBe(false);
  });
});

describe("appointmentReportHref", () => {
  const given = peerAppointment({
    id: "meeting-9",
    side: AppointmentSide.Mentor,
    startsAt: "2026-11-12T08:00:00.000Z",
  });
  const after = new Date("2026-11-12T08:00:00.001Z");

  it("links a started peer meeting the student gave to its report", () => {
    expect(appointmentReportHref(given, after)).toBe(
      "/student/peer-mentoring/reports/meetings/meeting-9",
    );
  });

  it("has no report until the meeting has started, as the backend counts it", () => {
    expect(
      appointmentReportHref(given, new Date("2026-11-12T08:00:00.000Z")),
    ).toBeNull();
  });

  it("has no report for a cancelled meeting", () => {
    expect(
      appointmentReportHref(
        { ...given, status: AppointmentStatus.Cancelled },
        after,
      ),
    ).toBeNull();
  });

  it("has no report on the mentee's side", () => {
    expect(
      appointmentReportHref({ ...given, side: AppointmentSide.Mentee }, after),
    ).toBeNull();
  });

  it("has no report for Office Hours", () => {
    expect(
      appointmentReportHref(
        { ...given, kind: AppointmentKind.OfficeHours },
        after,
      ),
    ).toBeNull();
  });
});
