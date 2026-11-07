import type { ComponentProps } from "react";

import type { StatusChip } from "@/components/admin/admin-ui";
import {
  AppointmentKind,
  AppointmentSide,
  AppointmentStatus,
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
