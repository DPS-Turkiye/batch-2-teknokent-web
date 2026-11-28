import { describe, vi } from "vitest";

import { WeekVisibility } from "@/interfaces/program-week";
import { backendHttp } from "@/lib/client/backend-http";
import {
  alignProgramDates,
  getProgramThisWeek,
  getProgramWeekPlan,
  getProgramWeeksSoFar,
  saveProgramWeekPlan,
  setProgramWeekVisibility,
} from "@/lib/client/program-weeks";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";
import { specialDay } from "@test/fixtures/program-week";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const calls: ClientCall[] = [
  {
    title: "getProgramThisWeek reads the running week",
    call: () => getProgramThisWeek(),
    method: "get",
    args: ["/api/programs/mine/this-week"],
  },
  {
    title: "getProgramWeeksSoFar reads the weeks reached so far",
    call: () => getProgramWeeksSoFar(),
    method: "get",
    args: ["/api/programs/mine/weeks"],
  },
];

/** Calls that go straight to the backend. */
const backendCalls: ClientCall[] = [
  {
    title: "getProgramWeekPlan reads the encoded program's plan",
    call: () => getProgramWeekPlan("prog/1"),
    method: "get",
    args: ["/api/coordinator/programs/prog%2F1/weeks"],
  },
  {
    title: "saveProgramWeekPlan puts the weeks and the special days",
    call: () => saveProgramWeekPlan("prog/1", [], [specialDay()]),
    method: "put",
    args: [
      "/api/coordinator/programs/prog%2F1/weeks",
      { weeks: [], specialDays: [specialDay()] },
    ],
  },
  {
    title: "alignProgramDates moves the program onto the plan's dates",
    call: () => alignProgramDates("prog/1"),
    method: "post",
    args: ["/api/coordinator/programs/prog%2F1/weeks/align-dates"],
  },
  {
    title: "setProgramWeekVisibility sets one saved week's setting",
    call: () => setProgramWeekVisibility("prog/1", 3, WeekVisibility.Hidden),
    method: "put",
    args: [
      "/api/coordinator/programs/prog%2F1/weeks/3/visibility",
      { visibility: WeekVisibility.Hidden },
    ],
  },
];

describe("program weeks client", () => {
  itSendsEachClientCall(calls);
  itSendsEachClientCall(backendCalls, backendHttp);
});
