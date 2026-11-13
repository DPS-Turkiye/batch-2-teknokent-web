import { beforeEach, describe, expect, it, vi } from "vitest";

import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { UserRole } from "@/interfaces/session";
import {
  createPeerMentoringRequest,
  deletePeerMentorDraft,
  getPeerCategories,
  getPeerMentor,
  getPeerMentorCounts,
  getPeerMentorDraft,
  getPeerMentoringRequests,
  getPeerMentorProfile,
  getPeerMentors,
  getReceivedPeerRequests,
  savePeerMentorDraft,
  savePeerMentorProfile,
} from "@/lib/client/peer-mentoring";
import { httpClient } from "@/lib/http-client";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";
import { createMentorResponse } from "@test/fixtures/mentors";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const request = {
  mentorId: "peer-1",
  category: PeerTopicCategory.CareerInternship,
  message: "Staj başvurusu için yardım",
};
const profile = {
  categories: [PeerTopicCategory.TechnicalDigital],
  subTopics: ["React"],
  strongCourses: ["CENG 242"],
  projects: [],
  erasmus: "",
  helpWith: "Frontend",
  linkedinUrl: "",
  levels: {},
  experiences: [],
};

const draftBody = {
  step: "topics",
  categories: [PeerTopicCategory.CareerInternship],
  subTopics: null,
  strongCourses: null,
  projects: null,
  erasmus: null,
  helpWith: null,
  linkedinUrl: null,
  levels: null,
  experiences: null,
};

const calls: ClientCall[] = [
  {
    title: "getPeerMentors sends the chosen category and search text",
    call: () =>
      getPeerMentors({
        category: PeerTopicCategory.AcademicDevelopment,
        query: "lineer",
      }),
    method: "get",
    args: [
      "/api/peer-mentoring/mentors",
      {
        params: {
          category: PeerTopicCategory.AcademicDevelopment,
          q: "lineer",
        },
      },
    ],
  },
  {
    title:
      "getPeerMentors leaves out an empty filter instead of sending blanks",
    call: () => getPeerMentors({ category: null, query: "" }),
    method: "get",
    args: [
      "/api/peer-mentoring/mentors",
      { params: { category: undefined, q: undefined } },
    ],
  },
  {
    title:
      "getPeerMentors sends a sub-topic and asks for this week only when set",
    call: () =>
      getPeerMentors({
        category: null,
        query: "",
        subTopic: "fixture-cv",
        availableThisWeek: true,
      }),
    method: "get",
    args: [
      "/api/peer-mentoring/mentors",
      {
        params: {
          category: undefined,
          q: undefined,
          subTopic: "fixture-cv",
          availableThisWeek: true,
        },
      },
    ],
  },
  {
    title: "getPeerMentor reads one mentor by id",
    call: () => getPeerMentor("8c5f0f0e-6a3e-4c55-9d2d-2a7c7b1f0a11"),
    method: "get",
    args: ["/api/peer-mentoring/mentors/8c5f0f0e-6a3e-4c55-9d2d-2a7c7b1f0a11"],
  },
  {
    title: "getPeerMentorCounts reads the mentors per category",
    call: () => getPeerMentorCounts(),
    method: "get",
    args: ["/api/peer-mentoring/mentor-counts"],
  },
  {
    title: "savePeerMentorDraft puts the draft under its own key",
    call: () => savePeerMentorDraft(draftBody),
    method: "put",
    args: ["/api/peer-mentoring/profile/draft", { draft: draftBody }],
  },
  {
    title: "deletePeerMentorDraft deletes the draft",
    call: () => deletePeerMentorDraft(),
    method: "delete",
    args: ["/api/peer-mentoring/profile/draft"],
    returnsNothing: true,
  },
  {
    title: "getPeerCategories reads a student's categories with no side param",
    call: () => getPeerCategories(),
    method: "get",
    args: ["/api/peer-mentoring/categories", undefined],
  },
  {
    title: "getPeerCategories reads a peer mentor's categories as a mentor",
    call: () => getPeerCategories(UserRole.Mentor),
    method: "get",
    args: [
      "/api/peer-mentoring/categories",
      { params: { as: UserRole.Mentor } },
    ],
  },
  {
    title: "getPeerMentoringRequests lists the student's own requests",
    call: () => getPeerMentoringRequests(),
    method: "get",
    args: ["/api/peer-mentoring/requests"],
  },
  {
    title: "createPeerMentoringRequest posts the request",
    call: () => createPeerMentoringRequest(request),
    method: "post",
    args: ["/api/peer-mentoring/requests", request],
  },
  {
    title: "getReceivedPeerRequests lists requests sent to the peer mentor",
    call: () => getReceivedPeerRequests(),
    method: "get",
    args: ["/api/peer-mentoring/requests", { params: { as: UserRole.Mentor } }],
  },
  {
    title: "getPeerMentorProfile reads the peer mentor's own profile",
    call: () => getPeerMentorProfile(),
    method: "get",
    args: ["/api/peer-mentoring/profile"],
  },
  {
    title: "savePeerMentorProfile puts the whole profile",
    call: () => savePeerMentorProfile(profile),
    method: "put",
    args: ["/api/peer-mentoring/profile", profile],
  },
];

describe("peer mentoring client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls);

  it("getPeerMentor answers null for a mentor the directory doesn't list or a malformed id", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce(
      createMentorResponse({ message: "Bulunamadı." }, 404),
    );
    await expect(getPeerMentor("someone")).resolves.toBeNull();

    vi.mocked(httpClient.get).mockResolvedValueOnce(
      createMentorResponse({ message: "Geçersiz." }, 400),
    );
    await expect(getPeerMentor("not-a-uuid")).resolves.toBeNull();
  });

  it("getPeerMentor still fails on a server error", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce(
      createMentorResponse({ message: "Hata" }, 500),
    );
    await expect(getPeerMentor("someone")).rejects.toThrow();
  });

  it("getPeerMentorDraft answers null when there is no draft", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce(
      createMentorResponse({ message: "Taslak yok." }, 404),
    );
    await expect(getPeerMentorDraft()).resolves.toBeNull();
  });

  it("getPeerMentorProfile answers null before the wizard has published a profile", async () => {
    vi.mocked(httpClient.get).mockResolvedValue(
      createMentorResponse({ message: "Profil bulunamadı." }, 404),
    );

    await expect(getPeerMentorProfile()).resolves.toBeNull();
  });
});
