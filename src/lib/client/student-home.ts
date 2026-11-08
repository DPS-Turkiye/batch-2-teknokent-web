import { getStudentProfileCompletion } from "@/lib/client/student-profile-completion";
import type { StudentHome } from "@/interfaces/student-home";
import { fixtureResponse } from "@/lib/client/fixtures/fixture-response";
import { STUDENT_HOME_FIXTURE } from "@/lib/client/fixtures/student-home";

// Fixture-only home/profile state. No production API is assumed.
export async function getStudentHome(): Promise<StudentHome> {
  const profile = await getStudentProfileCompletion();
  return fixtureResponse({
    ...STUDENT_HOME_FIXTURE,
    profileCompleted: profile.completed || profile.skipped,
  });
}
