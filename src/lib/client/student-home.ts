import type { StudentHome } from "@/interfaces/student-home";
import { HOME_UPCOMING_LIMIT, splitAppointments } from "@/lib/appointments";
import { getStudentAppointments } from "@/lib/client/student-appointments";
import { getStudentProfileCompletion } from "@/lib/client/student-profile-completion";

export async function getStudentHome(now = new Date()): Promise<StudentHome> {
  const [profile, appointments] = await Promise.all([
    getStudentProfileCompletion(),
    getStudentAppointments(),
  ]);
  return {
    profileCompleted: profile.completed || profile.skipped,
    upcomingAppointments: splitAppointments(appointments, now).upcoming.slice(
      0,
      HOME_UPCOMING_LIMIT,
    ),
  };
}
