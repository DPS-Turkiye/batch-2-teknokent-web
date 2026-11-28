import { beforeEach, expect, it, vi } from "vitest";

import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { UserRole } from "@/interfaces/session";
import { backendHttp } from "@/lib/client/backend-http";
import { EMPTY_PROFILE_COMPLETION } from "@/lib/client/fixtures/student-profile-completion";
import { getPeerCategories } from "@/lib/client/peer-mentoring";
import {
  getPeerMentorCategories,
  getProfileCompletionCategories,
  getStudentProfileCompletion,
  saveStudentProfileCompletion,
} from "@/lib/client/student-profile-completion";

vi.mock("@/lib/client/peer-mentoring", () => ({
  getPeerCategories: vi.fn(),
}));
vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

beforeEach(() => {
  vi.clearAllMocks();
});

it("reads and saves the student's interests on the backend directly", async () => {
  const saved = {
    ...EMPTY_PROFILE_COMPLETION,
    topics: [PeerTopicCategory.AcademicDevelopment],
    goal: "Yaz stajı",
    completed: true,
  };
  vi.mocked(backendHttp.get).mockResolvedValue({
    status: 200,
    data: EMPTY_PROFILE_COMPLETION,
  });
  vi.mocked(backendHttp.put).mockResolvedValue({
    status: 200,
    data: saved,
  });

  expect(await getStudentProfileCompletion()).toEqual(EMPTY_PROFILE_COMPLETION);
  expect(backendHttp.get).toHaveBeenCalledWith(
    "/api/student/profile-completion",
  );
  expect(await saveStudentProfileCompletion(saved)).toEqual(saved);
  expect(backendHttp.put).toHaveBeenCalledWith(
    "/api/student/profile-completion",
    saved,
  );
});

it("drops topics the board no longer offers and fills what a student who never saved left empty", async () => {
  // The page sends the GET's answer back on skip, whatever the server had in it.
  vi.mocked(backendHttp.get).mockResolvedValue({
    status: 200,
    data: {
      topics: [PeerTopicCategory.CampusLife, "RETIRED_TOPIC"],
      subtopics: null,
      goal: null,
      completed: null,
      skipped: true,
    },
  });
  vi.mocked(backendHttp.put).mockResolvedValue({ status: 200, data: {} });

  await saveStudentProfileCompletion(await getStudentProfileCompletion());

  expect(backendHttp.put).toHaveBeenCalledWith(
    "/api/student/profile-completion",
    {
      topics: [PeerTopicCategory.CampusLife],
      subtopics: [],
      goal: "",
      completed: false,
      skipped: true,
    },
  );
});

it("turns a refused save into an error instead of a saved profile", async () => {
  vi.mocked(backendHttp.put).mockResolvedValue({
    status: 400,
    data: { message: "Bu kategori programında etkin değil." },
  });

  await expect(
    saveStudentProfileCompletion(EMPTY_PROFILE_COMPLETION),
  ).rejects.toThrow("Bu kategori programında etkin değil.");
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
  expect(categories[0]?.subtopics).toHaveLength(1);

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
