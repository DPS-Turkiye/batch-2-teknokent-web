import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchCoordinatorMentorship,
  fetchCoordinatorMentorships,
  remindCoordinatorMentorship,
} from "@/lib/api/coordinator-mentorships";
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
    "lists every program's mentorships when no program is picked",
    () => fetchCoordinatorMentorships("coord-1", null),
    {
      method: "GET",
      url: "/api/coordinator/mentorships",
      params: { actorId: "coord-1" },
    },
  ],
  [
    "narrows mentorships to the picked program",
    () => fetchCoordinatorMentorships("coord-1", "prog-1"),
    {
      method: "GET",
      url: "/api/coordinator/mentorships",
      params: { actorId: "coord-1", programId: "prog-1" },
    },
  ],
  [
    "reads one encoded mentorship",
    () => fetchCoordinatorMentorship("coord-1", "ms/1"),
    {
      method: "GET",
      url: "/api/coordinator/mentorships/ms%2F1",
      params: { actorId: "coord-1" },
    },
  ],
  [
    "reminds an encoded mentorship's pair",
    () => remindCoordinatorMentorship("coord-1", "ms/1"),
    {
      method: "POST",
      url: "/api/coordinator/mentorships/ms%2F1/remind",
      params: { actorId: "coord-1" },
    },
  ],
];

describe("coordinator mentorships server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
