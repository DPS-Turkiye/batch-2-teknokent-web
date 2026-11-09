import type { Appointment } from "@/interfaces/appointment";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

/** Peer-mentoring sessions only: Office Hours is not connected to Menton yet. */
export async function getStudentAppointments() {
  return requireSuccess(
    await httpClient.get<Appointment[]>("/api/student/appointments"),
  );
}
