import type { Appointment } from "@/interfaces/appointment";

/** The student workspace's Ana Sayfa, put together in the browser from the student's own data. */
export type StudentHome = {
  /** False until the student finishes or skips the 3-step profile completion. */
  profileCompleted: boolean;
  /** Appointments still ahead (pending, alternative proposed or confirmed), soonest first, at most three. */
  upcomingAppointments: Appointment[];
};
