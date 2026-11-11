import { beforeEach, describe, expect, it, vi } from "vitest";

import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { UserRole } from "@/interfaces/session";
import {
  createPeerMentoringRequest,
  getPeerCategories,
  getPeerMentoringRequests,
  getPeerMentorProfile,
  getPeerMentors,
  getReceivedPeerRequests,
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

  it("getPeerMentorProfile answers null before the wizard has published a profile", async () => {
    vi.mocked(httpClient.get).mockResolvedValue(
      createMentorResponse({ message: "Profil bulunamadı." }, 404),
    );

    await expect(getPeerMentorProfile()).resolves.toBeNull();
  });
});
