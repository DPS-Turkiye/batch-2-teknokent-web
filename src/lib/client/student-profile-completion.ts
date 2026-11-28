import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { UserRole } from "@/interfaces/session";
import type { StudentProfileCompletion } from "@/interfaces/student-profile-completion";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { PROFILE_COMPLETION_CATEGORIES } from "@/lib/client/fixtures/student-profile-completion";
import { getPeerCategories } from "@/lib/client/peer-mentoring";
import { isEnumValue } from "@/lib/enum";
import { activeCatalogue } from "@/lib/student-interests";

const URL = "/api/student/profile-completion";

/** The signed-in student's saved interests and goal; empty and unfinished until they save once. */
export async function getStudentProfileCompletion() {
  return requireSuccess(await backendHttp.get<StudentProfileCompletion>(URL));
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
/**
 * What the server sends is typed but not trusted: a student who never saved gets nulls, and the page sends the
 * GET's answer back on skip. These read such a field as empty.
 */
function listOrEmpty(value: readonly string[] | null | undefined) {
  return value ?? [];
}

function textOrEmpty(value: string | null | undefined) {
  return value ?? "";
}

function flag(value: boolean | null | undefined) {
  return value ?? false;
}

/**
 * The whole set is replaced. A topic the board no longer offers (say, from an old draft) is dropped rather than
 * refused.
 */
export async function saveStudentProfileCompletion(
  draft: StudentProfileCompletion,
) {
  return requireSuccess(
    await backendHttp.put<StudentProfileCompletion>(URL, {
      topics: listOrEmpty(draft.topics).filter((topic) =>
        isEnumValue(PeerTopicCategory, topic),
      ),
      subtopics: listOrEmpty(draft.subtopics),
      goal: textOrEmpty(draft.goal),
      completed: flag(draft.completed),
      skipped: flag(draft.skipped),
    }),
  );
}
