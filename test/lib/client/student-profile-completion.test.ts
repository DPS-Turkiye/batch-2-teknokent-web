import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { UserRole } from "@/interfaces/session";
import { beforeEach, expect, it, vi } from "vitest";
import { getPeerCategories } from "@/lib/client/peer-mentoring";
import {
  getPeerMentorCategories,
  getStudentProfileCompletion,
  getProfileCompletionCategories,
  saveStudentProfileCompletion,
} from "@/lib/client/student-profile-completion";
import { EMPTY_PROFILE_COMPLETION } from "@/lib/client/fixtures/student-profile-completion";
import { httpClient } from "@/lib/http-client";

vi.mock("@/lib/client/peer-mentoring", () => ({
  getPeerCategories: vi.fn(),
}));
vi.mock("@/lib/http-client", () => ({
  httpClient: { get: vi.fn(), put: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

it("reads and saves the student's interests through the app's own API", async () => {
  const saved = {
    ...EMPTY_PROFILE_COMPLETION,
    topics: [PeerTopicCategory.AcademicDevelopment],
    goal: "Yaz stajı",
    completed: true,
  };
  vi.mocked(httpClient.get).mockResolvedValue({
    status: 200,
    data: EMPTY_PROFILE_COMPLETION,
  } as never);
  vi.mocked(httpClient.put).mockResolvedValue({
    status: 200,
    data: saved,
  } as never);

  expect(await getStudentProfileCompletion()).toEqual(EMPTY_PROFILE_COMPLETION);
  expect(httpClient.get).toHaveBeenCalledWith(
    "/api/student/profile-completion",
  );
  expect(await saveStudentProfileCompletion(saved)).toEqual(saved);
  expect(httpClient.put).toHaveBeenCalledWith(
    "/api/student/profile-completion",
    saved,
  );
});

it("turns a refused save into an error instead of a saved profile", async () => {
  vi.mocked(httpClient.put).mockResolvedValue({
    status: 400,
    data: { message: "Bu kategori programında etkin değil." },
  } as never);

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
