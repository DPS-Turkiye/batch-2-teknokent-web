import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import {
  fetchStudentProfileCompletion,
  saveStudentProfileCompletion,
} from "@/lib/api/student-profile-completion";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

type RequestCase = [
  description: string,
  call: () => Promise<unknown>,
  request: AxiosRequestConfig,
];

const cases: RequestCase[] = [
  [
    "reads the student's profile completion",
    () => fetchStudentProfileCompletion("student-1"),
    {
      method: "GET",
      url: "/api/student/profile-completion",
      params: { actorId: "student-1" },
    },
  ],
  [
    "saves the completion with the actor added to the body",
    () =>
      saveStudentProfileCompletion("student-1", {
        topics: [PeerTopicCategory.CareerInternship],
        subtopics: ["CV"],
        goal: "Staj bulmak",
        completed: true,
        skipped: false,
      }),
    {
      method: "PUT",
      url: "/api/student/profile-completion",
      data: {
        topics: [PeerTopicCategory.CareerInternship],
        subtopics: ["CV"],
        goal: "Staj bulmak",
        completed: true,
        skipped: false,
        actorId: "student-1",
      },
    },
  ],
];

describe("student profile completion server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
