import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchProgramThisWeek,
  fetchProgramWeeksSoFar,
} from "@/lib/api/program-weeks";
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
    "reads the caller's own program's running week",
    () => fetchProgramThisWeek("member-1"),
    {
      method: "GET",
      url: "/api/programs/mine/this-week",
      params: { actorId: "member-1" },
    },
  ],
  [
    "reads the weeks the caller's own program has reached",
    () => fetchProgramWeeksSoFar("member-1"),
    {
      method: "GET",
      url: "/api/programs/mine/weeks",
      params: { actorId: "member-1" },
    },
  ],
];

describe("program weeks server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
