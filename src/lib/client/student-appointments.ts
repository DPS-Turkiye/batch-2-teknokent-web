import type { Appointment } from "@/interfaces/appointment";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { getStudentOfficeHoursAppointments } from "@/lib/client/student-office-hours";

/** Peer-mentoring sessions from the backend, plus the Office Hours requests (sample data until a source exists). */
export async function getStudentAppointments(): Promise<Appointment[]> {
  const [peer, officeHours] = await Promise.all([
    backendHttp.get<Appointment[]>("/api/peer-mentoring/appointments"),
    getStudentOfficeHoursAppointments(),
  ]);
  return [...requireSuccess(peer), ...officeHours];
}
