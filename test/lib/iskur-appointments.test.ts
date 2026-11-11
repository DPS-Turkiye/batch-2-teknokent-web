import { describe, expect, it } from "vitest";

import { AppointmentSide } from "@/interfaces/appointment";
import { matchesAppointmentRole } from "@/lib/iskur-appointments";
import { AppointmentRoleFilter } from "@/types/iskur-appointments";

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
