import type { Appointment } from "@/interfaces/appointment";

/**
 * The student workspace's Ana Sayfa. Planned backend: `GET /api/student/home` for the signed-in
 * student; until it exists the client wrapper answers from a fixture.
 */
export type StudentHome = {
  /** False until the student finishes or skips the 3-step profile completion. */
  profileCompleted: boolean;
  /** Peer-mentoring and Office Hours appointments still ahead (pending, alternative proposed
   * or confirmed), soonest first, at most three. */
  upcomingAppointments: Appointment[];
};
