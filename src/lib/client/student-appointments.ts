import type { Appointment } from "@/interfaces/appointment";
import { fixtureResponse } from "@/lib/client/fixtures/fixture-response";
import { STUDENT_APPOINTMENTS_FIXTURE } from "@/lib/client/fixtures/student-appointments";

// Display fixtures only. No live appointment API or Office Hours identity mapping is assumed.
export function getStudentAppointments(): Promise<Appointment[]> {
  return fixtureResponse(STUDENT_APPOINTMENTS_FIXTURE);
}
