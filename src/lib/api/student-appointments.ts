import "server-only";

import type { Appointment } from "@/interfaces/appointment";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

/** The sessions booked on the student's peer-mentoring requests, as mentee and as mentor. */
export function fetchStudentAppointments(actorId: string) {
  return backendRequest<Appointment[]>({
    method: HttpMethod.Get,
    url: "/api/peer-mentoring/appointments",
    params: { actorId },
  });
}
