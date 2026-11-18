import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  alignProgramDates,
  fetchProgramThisWeek,
  fetchProgramWeekPlan,
  fetchProgramWeeksSoFar,
  replaceProgramWeekPlan,
} from "@/lib/api/program-weeks";
import { backendRequest } from "@/lib/server/backend-client";
import { specialDay } from "@test/fixtures/program-week";

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
    "aligns dates as the session coordinator",
    () => alignProgramDates("coord-1", "prog/1"),
    {
      method: "POST",
      url: "/api/coordinator/programs/prog%2F1/weeks/align-dates",
      params: { actorId: "coord-1" },
    },
  ],
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
    () => replaceProgramWeekPlan("coord-1", "prog/1", [], [specialDay()]),
    {
      method: "PUT",
      url: "/api/coordinator/programs/prog%2F1/weeks",
      data: { actorId: "coord-1", weeks: [], specialDays: [specialDay()] },
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
