import { AppointmentSide, type Appointment } from "@/interfaces/appointment";
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
