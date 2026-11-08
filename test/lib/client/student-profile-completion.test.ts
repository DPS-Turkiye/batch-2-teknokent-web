import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { afterEach, expect, it } from "vitest";
import {
  getStudentProfileCompletion,
  getProfileCompletionCategories,
  saveStudentProfileCompletion,
} from "@/lib/client/student-profile-completion";
import { EMPTY_PROFILE_COMPLETION } from "@/lib/client/fixtures/student-profile-completion";
import { getStudentHome } from "@/lib/client/student-home";
afterEach(async () => {
  await saveStudentProfileCompletion(EMPTY_PROFILE_COMPLETION);
});
it("clones reads and writes, and shares completion/skip with fixture home", async () => {
  const draft = {
    ...EMPTY_PROFILE_COMPLETION,
    topics: [PeerTopicCategory.AcademicDevelopment],
    skipped: true,
  };
  await saveStudentProfileCompletion(draft);
  draft.topics.pop();
  const read = await getStudentProfileCompletion();
  expect(read.topics).toEqual([PeerTopicCategory.AcademicDevelopment]);
  read.topics.pop();
  expect((await getStudentProfileCompletion()).topics).toHaveLength(1);
  expect((await getStudentHome()).profileCompleted).toBe(true);
  await saveStudentProfileCompletion(EMPTY_PROFILE_COMPLETION);
  expect((await getStudentHome()).profileCompleted).toBe(false);
});
it("returns a separate sample taxonomy copy with only eight board categories", async () => {
  const categories = await getProfileCompletionCategories();
  expect(categories).toHaveLength(8);
  categories[0].subtopics.length = 0;
  expect((await getProfileCompletionCategories())[0].subtopics).toHaveLength(1);
});
