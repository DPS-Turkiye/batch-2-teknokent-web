import { UserRole } from "@/interfaces/session";
import type { StudentProfileCompletion } from "@/interfaces/student-profile-completion";
import { requireSuccess } from "@/lib/client/api";
import { PROFILE_COMPLETION_CATEGORIES } from "@/lib/client/fixtures/student-profile-completion";
import { getPeerCategories } from "@/lib/client/peer-mentoring";
import { httpClient } from "@/lib/http-client";
import { activeCatalogue } from "@/lib/student-interests";

const URL = "/api/student/profile-completion";

/** The signed-in student's saved interests and goal; empty and unfinished until they save once. */
export async function getStudentProfileCompletion() {
  return requireSuccess(await httpClient.get<StudentProfileCompletion>(URL));
}
/** The categories active in the student's program, each with the catalogue's sample sub-topics. */
export async function getProfileCompletionCategories() {
  return activeCatalogue(
    PROFILE_COMPLETION_CATEGORIES,
    await getPeerCategories(UserRole.Mentee),
  );
}
/** The peer-mentor wizard's choices: the categories of the programs the student mentors in. */
export async function getPeerMentorCategories() {
  return activeCatalogue(
    PROFILE_COMPLETION_CATEGORIES,
    await getPeerCategories(UserRole.Mentor),
  );
}
export async function saveStudentProfileCompletion(
  draft: StudentProfileCompletion,
) {
  return requireSuccess(
    await httpClient.put<StudentProfileCompletion>(URL, draft),
  );
}
