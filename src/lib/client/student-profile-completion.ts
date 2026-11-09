import type { StudentProfileCompletion } from "@/interfaces/student-profile-completion";
import { UserRole } from "@/interfaces/session";
import { fixtureResponse } from "@/lib/client/fixtures/fixture-response";
import {
  EMPTY_PROFILE_COMPLETION,
  PROFILE_COMPLETION_CATEGORIES,
} from "@/lib/client/fixtures/student-profile-completion";
import { getPeerCategories } from "@/lib/client/peer-mentoring";
import { activeCatalogue } from "@/lib/student-interests";

// Browser-module memory only, reset on reload. No localStorage, backend or account mutation.
let fixtureDraft = structuredClone(EMPTY_PROFILE_COMPLETION);
export function getStudentProfileCompletion() {
  return fixtureResponse(fixtureDraft);
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
export function saveStudentProfileCompletion(draft: StudentProfileCompletion) {
  fixtureDraft = structuredClone(draft);
  return fixtureResponse(fixtureDraft);
}
