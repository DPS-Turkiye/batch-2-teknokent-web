import type { StudentProfileCompletion } from "@/interfaces/student-profile-completion";
import { fixtureResponse } from "@/lib/client/fixtures/fixture-response";
import {
  EMPTY_PROFILE_COMPLETION,
  PROFILE_COMPLETION_CATEGORIES,
} from "@/lib/client/fixtures/student-profile-completion";

// Browser-module memory only, reset on reload. No localStorage, backend or account mutation.
let fixtureDraft = structuredClone(EMPTY_PROFILE_COMPLETION);
export function getStudentProfileCompletion() {
  return fixtureResponse(fixtureDraft);
}
export function getProfileCompletionCategories() {
  return fixtureResponse(PROFILE_COMPLETION_CATEGORIES);
}
export function saveStudentProfileCompletion(draft: StudentProfileCompletion) {
  fixtureDraft = structuredClone(draft);
  return fixtureResponse(fixtureDraft);
}
