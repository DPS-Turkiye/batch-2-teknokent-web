import { describe, expect, it } from "vitest";

import { AppointmentStatus } from "@/interfaces/appointment";
import { APPOINTMENT_STATUS_TONE } from "@/lib/appointments";

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
