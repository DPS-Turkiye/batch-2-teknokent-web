import {
  AppointmentKind,
  AppointmentSide,
  AppointmentStatus,
  type Appointment,
} from "@/interfaces/appointment";
import { meetingReportHref } from "@/lib/peer-reports";
import { AppointmentRoleFilter } from "@/types/iskur-appointments";

const SIDE_OF: Record<
  Exclude<AppointmentRoleFilter, AppointmentRoleFilter.All>,
  AppointmentSide
> = {
  [AppointmentRoleFilter.AsMentor]: AppointmentSide.Mentor,
  [AppointmentRoleFilter.AsMentee]: AppointmentSide.Mentee,
};

/** Whether an appointment stays under the chosen role ("Mentor olarak" keeps the ones the student gives). */
export function matchesAppointmentRole(
  appointment: Pick<Appointment, "side">,
  role: AppointmentRoleFilter,
) {
  return (
    role === AppointmentRoleFilter.All || appointment.side === SIDE_OF[role]
  );
}

/**
 * Where the mentor writes the meeting's report, or null when there is none to write. The backend takes a report for a
 * peer meeting the student gave that was not cancelled and has started; the appointment's id is the meeting's.
 */
export function appointmentReportHref(
  appointment: Pick<
    Appointment,
    "id" | "kind" | "side" | "status" | "startsAt"
  >,
  now: Date,
): string | null {
  const reportable =
    appointment.kind === AppointmentKind.PeerMentoring &&
    appointment.side === AppointmentSide.Mentor &&
    appointment.status !== AppointmentStatus.Cancelled &&
    Date.parse(appointment.startsAt) < now.getTime();
  return reportable ? meetingReportHref(appointment.id) : null;
}
