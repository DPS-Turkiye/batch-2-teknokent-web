import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  PeerTopicCategory,
  type PeerMentorProfileDraft,
} from "@/interfaces/peer-mentoring";
import { UserRole } from "@/interfaces/session";
import {
  createPeerMentoringRequest,
  deletePeerMentorDraft,
  fetchPeerCategories,
  fetchPeerMentor,
  fetchPeerMentorCounts,
  fetchPeerMentorDraft,
  fetchPeerMentoringRequests,
  fetchPeerMentorProfile,
  fetchPeerMentors,
  savePeerMentorDraft,
  savePeerMentorProfile,
} from "@/lib/api/peer-mentoring";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

const EMPTY_DRAFT: PeerMentorProfileDraft = {
  step: null,
  categories: null,
  subTopics: null,
  strongCourses: null,
  projects: null,
  erasmus: null,
  helpWith: null,
  linkedinUrl: null,
  levels: null,
  experiences: null,
};

type RequestCase = [
  description: string,
  call: () => Promise<unknown>,
  request: AxiosRequestConfig,
];

const cases: RequestCase[] = [
  [
    "lists peer mentors without filters",
    () => fetchPeerMentors("student-1", {}),
    {
      method: "GET",
      url: "/api/peer-mentoring/mentors",
      params: { actorId: "student-1" },
    },
  ],
  [
    "lists peer mentors filtered by category and search text",
    () =>
      fetchPeerMentors("student-1", {
        category: PeerTopicCategory.Entrepreneurship,
        q: "fon",
      }),
    {
      method: "GET",
      url: "/api/peer-mentoring/mentors",
      params: {
        actorId: "student-1",
        category: PeerTopicCategory.Entrepreneurship,
        q: "fon",
      },
    },
  ],
  [
    "lists peer mentors by sub-topic with a free slot this week",
    () =>
      fetchPeerMentors("student-1", {
        subTopic: "fixture-cv",
        availableThisWeek: true,
      }),
    {
      method: "GET",
      url: "/api/peer-mentoring/mentors",
      params: {
        actorId: "student-1",
        subTopic: "fixture-cv",
        availableThisWeek: true,
      },
    },
  ],
  [
    "reads one mentor of the actor's program",
    () => fetchPeerMentor("student-1", "mentor-1"),
    {
      method: "GET",
      url: "/api/peer-mentoring/mentors/mentor-1",
      params: { actorId: "student-1" },
    },
  ],
  [
    "reads the actor's draft",
    () => fetchPeerMentorDraft("student-1"),
    {
      method: "GET",
      url: "/api/peer-mentoring/profile/draft",
      params: { actorId: "student-1" },
    },
  ],
  [
    "saves the actor's draft with the actor next to it",
    () => savePeerMentorDraft("student-1", EMPTY_DRAFT),
    {
      method: "PUT",
      url: "/api/peer-mentoring/profile/draft",
      data: { actorId: "student-1", draft: EMPTY_DRAFT },
    },
  ],
  [
    "deletes the actor's draft",
    () => deletePeerMentorDraft("student-1"),
    {
      method: "DELETE",
      url: "/api/peer-mentoring/profile/draft",
      params: { actorId: "student-1" },
    },
  ],
  [
    "escapes the mentor id in the path",
    () => fetchPeerMentor("student-1", "a/../b"),
    {
      method: "GET",
      url: "/api/peer-mentoring/mentors/a%2F..%2Fb",
      params: { actorId: "student-1" },
    },
  ],
  [
    "reads the mentors per category of the actor's program",
    () => fetchPeerMentorCounts("student-1"),
    {
      method: "GET",
      url: "/api/peer-mentoring/mentor-counts",
      params: { actorId: "student-1" },
    },
  ],
  [
    "lists the categories of the side the caller asks as",
    () => fetchPeerCategories("student-1", UserRole.Mentor),
    {
      method: "GET",
      url: "/api/peer-mentoring/categories",
      params: { actorId: "student-1", as: UserRole.Mentor },
    },
  ],
  [
    "lists requests of the side the caller asks as",
    () => fetchPeerMentoringRequests("student-1", UserRole.Mentee),
    {
      method: "GET",
      url: "/api/peer-mentoring/requests",
      params: { actorId: "student-1", as: UserRole.Mentee },
    },
  ],
  [
    "creates a request with the actor added to the body",
    () =>
      createPeerMentoringRequest("student-1", {
        mentorId: "student-2",
        category: PeerTopicCategory.CampusLife,
        message: "Merhaba",
      }),
    {
      method: "POST",
      url: "/api/peer-mentoring/requests",
      data: {
        mentorId: "student-2",
        category: PeerTopicCategory.CampusLife,
        message: "Merhaba",
        actorId: "student-1",
      },
    },
  ],
  [
    "reads the caller's peer mentor profile",
    () => fetchPeerMentorProfile("student-1"),
    {
      method: "GET",
      url: "/api/peer-mentoring/profile",
      params: { actorId: "student-1" },
    },
  ],
  [
    "saves the peer mentor profile with the actor added to the body",
    () =>
      savePeerMentorProfile("student-1", {
        categories: [PeerTopicCategory.TechnicalDigital],
        subTopics: [],
        strongCourses: ["CENG 140"],
        projects: [],
        erasmus: "",
        helpWith: "C",
        linkedinUrl: "",
        levels: {},
        experiences: [],
      }),
    {
      method: "PUT",
      url: "/api/peer-mentoring/profile",
      data: {
        categories: [PeerTopicCategory.TechnicalDigital],
        subTopics: [],
        strongCourses: ["CENG 140"],
        projects: [],
        erasmus: "",
        helpWith: "C",
        linkedinUrl: "",
        levels: {},
        experiences: [],
        actorId: "student-1",
      },
    },
  ],
];

describe("peer mentoring server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
