import { describe, vi } from "vitest";

import { WeekVisibility } from "@/interfaces/program-week";
import {
  getProgramThisWeek,
  getProgramWeeksSoFar,
  setProgramWeekVisibility,
} from "@/lib/client/program-weeks";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

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
});
