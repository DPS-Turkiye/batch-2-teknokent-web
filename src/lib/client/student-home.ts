import type { StudentHome } from "@/interfaces/student-home";
import { fixtureResponse } from "@/lib/client/fixtures/fixture-response";
import { STUDENT_HOME_FIXTURE } from "@/lib/client/fixtures/student-home";

// Answers from the fixture until GET /api/student/home exists.
export function getStudentHome(): Promise<StudentHome> {
  return fixtureResponse(STUDENT_HOME_FIXTURE);
}
