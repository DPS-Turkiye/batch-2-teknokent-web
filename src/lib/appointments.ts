import type { ComponentProps } from "react";

import type { StatusChip } from "@/components/admin/admin-ui";
import {
  AppointmentStatus,
  type Appointment,
  type AppointmentTime,
} from "@/interfaces/appointment";

type AppointmentTone = ComponentProps<typeof StatusChip>["tone"];

/** Pending and alternative-proposed never share a tone with Confirmed: a request is not an appointment yet. */
export const APPOINTMENT_STATUS_TONE: Record<
  AppointmentStatus,
  AppointmentTone
> = {
  [AppointmentStatus.Pending]: "amber",
  [AppointmentStatus.AlternativeProposed]: "blue",
  [AppointmentStatus.Confirmed]: "green",
  [AppointmentStatus.Rejected]: "red",
  [AppointmentStatus.Cancelled]: "red",
  [AppointmentStatus.Expired]: "neutral",
  [AppointmentStatus.Withdrawn]: "neutral",
};

/** Still to come: not answered no or called off, and not over yet. */
const OPEN_STATUSES = new Set([
  AppointmentStatus.Pending,
  AppointmentStatus.AlternativeProposed,
  AppointmentStatus.Confirmed,
]);

/**
 * The time an appointment stands at now: the proposed one while another time is on the table, else its own. Takes
 * any shape with a status and an alternative, so partial rows (`isUpcoming`'s Pick) work too.
 */
export function currentTime<
  T extends Pick<Appointment, "status" | "alternative">,
>(appointment: T): T | AppointmentTime {
  return appointment.status === AppointmentStatus.AlternativeProposed &&
    appointment.alternative
    ? appointment.alternative
    : appointment;
}

export function isUpcoming(
  appointment: Pick<Appointment, "status" | "endsAt" | "alternative">,
  now: Date,
) {
  return (
    OPEN_STATUSES.has(appointment.status) &&
    Date.parse(currentTime(appointment).endsAt) > now.getTime()
  );
}

/** Upcoming soonest first; everything else (held, cancelled, refused) newest first. */
export function splitAppointments(appointments: Appointment[], now: Date) {
  const byStart = appointments.toSorted(
    (a, b) =>
      Date.parse(currentTime(a).startsAt) - Date.parse(currentTime(b).startsAt),
  );
  return {
    upcoming: byStart.filter((item) => isUpcoming(item, now)),
    past: byStart.filter((item) => !isUpcoming(item, now)).reverse(),
  };
}
