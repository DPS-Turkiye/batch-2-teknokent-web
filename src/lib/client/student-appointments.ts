import type { Appointment } from "@/interfaces/appointment";
import { requireSuccess } from "@/lib/client/api";
import { getStudentOfficeHoursAppointments } from "@/lib/client/student-office-hours";
import { httpClient } from "@/lib/http-client";

/** Peer-mentoring sessions from the backend, plus the Office Hours requests (sample data until a source exists). */
export async function getStudentAppointments(): Promise<Appointment[]> {
  const [peer, officeHours] = await Promise.all([
    httpClient.get<Appointment[]>("/api/student/appointments"),
    getStudentOfficeHoursAppointments(),
  ]);
  return [...requireSuccess(peer), ...officeHours];
}
