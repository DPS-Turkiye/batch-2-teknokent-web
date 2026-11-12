import type { ComponentProps } from "react";

import type { StatusChip } from "@/components/admin/admin-ui";
import {
  AppointmentKind,
  AppointmentStatus,
  type Appointment,
  type AppointmentSide,
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

/** The row label key: Office Hours rows say so; peer-mentoring rows say which side the viewer is on. */
export function appointmentRoleKey(
  kind: AppointmentKind,
  side: AppointmentSide,
) {
  return kind === AppointmentKind.OfficeHours ? kind : side;
}

/** Still to come: not answered no or called off, and not over yet. */
const OPEN_STATUSES = new Set([
  AppointmentStatus.Pending,
  AppointmentStatus.AlternativeProposed,
  AppointmentStatus.Confirmed,
]);

export function isUpcoming(
  appointment: Pick<Appointment, "status" | "endsAt" | "alternative">,
  now: Date,
) {
  return (
    OPEN_STATUSES.has(appointment.status) &&
    Date.parse(appointment.endsAt) > now.getTime()
  );
}

/** Upcoming soonest first; everything else (held, cancelled, refused) newest first. */
export function splitAppointments(appointments: Appointment[], now: Date) {
  const byStart = appointments.toSorted(
    (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt),
  );
  return {
    upcoming: byStart.filter((item) => isUpcoming(item, now)),
    past: byStart.filter((item) => !isUpcoming(item, now)).reverse(),
  };
}

export const HOME_UPCOMING_LIMIT = 3;
