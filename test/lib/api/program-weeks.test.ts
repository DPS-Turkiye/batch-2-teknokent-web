import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchProgramThisWeek,
  fetchProgramWeekPlan,
  replaceProgramWeekPlan,
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
    "reads an encoded program's week plan",
    () => fetchProgramWeekPlan("coord-1", "prog/1"),
    {
      method: "GET",
      url: "/api/coordinator/programs/prog%2F1/weeks",
      params: { actorId: "coord-1" },
    },
  ],
  [
    "replaces the week plan",
    () => replaceProgramWeekPlan("coord-1", "prog/1", []),
    {
      method: "PUT",
      url: "/api/coordinator/programs/prog%2F1/weeks",
      data: { actorId: "coord-1", weeks: [] },
    },
  ],
  [
    "reads the caller's own program's running week",
    () => fetchProgramThisWeek("member-1"),
    {
      method: "GET",
      url: "/api/programs/mine/this-week",
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
