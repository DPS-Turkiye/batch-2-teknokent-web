import { describe, vi } from "vitest";

import {
  getProgramThisWeek,
  getProgramWeeksSoFar,
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
];

describe("program weeks client", () => {
  itSendsEachClientCall(calls);
});
