import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { UserRole } from "@/interfaces/session";
import { afterEach, expect, it, vi } from "vitest";
import { getPeerCategories } from "@/lib/client/peer-mentoring";
import {
  getPeerMentorCategories,
  getStudentProfileCompletion,
  getProfileCompletionCategories,
  saveStudentProfileCompletion,
} from "@/lib/client/student-profile-completion";

vi.mock("@/lib/client/peer-mentoring", () => ({
  getPeerCategories: vi.fn(),
}));
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
it("offers only the program's active categories, each with its sample sub-topics", async () => {
  vi.mocked(getPeerCategories).mockResolvedValue([
    PeerTopicCategory.International,
    PeerTopicCategory.CareerInternship,
  ]);
  const categories = await getProfileCompletionCategories();
  expect(getPeerCategories).toHaveBeenLastCalledWith(UserRole.Mentee);
  expect(categories.map((item) => item.id)).toEqual([
    PeerTopicCategory.CareerInternship,
    PeerTopicCategory.International,
  ]);
  expect(categories[0].subtopics).toHaveLength(1);

  vi.mocked(getPeerCategories).mockResolvedValue([]);
  expect(await getProfileCompletionCategories()).toEqual([]);
});

it("gives the peer-mentor wizard the categories of the programs the student mentors in", async () => {
  vi.mocked(getPeerCategories).mockResolvedValue([
    PeerTopicCategory.CampusLife,
  ]);
  const categories = await getPeerMentorCategories();
  expect(getPeerCategories).toHaveBeenLastCalledWith(UserRole.Mentor);
  expect(categories.map((item) => item.id)).toEqual([
    PeerTopicCategory.CampusLife,
  ]);
});
