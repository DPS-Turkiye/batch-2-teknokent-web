import type { Appointment } from "@/interfaces/appointment";

/** The student workspace's Ana Sayfa, put together in the browser from the student's own data. */
export type StudentHome = {
  /** False until the student finishes or skips the 3-step profile completion. */
  profileCompleted: boolean;
  /** Every appointment of the student; Ana Sayfa picks what is ahead (see `lib/student-home.ts`). */
  appointments: Appointment[];
};
