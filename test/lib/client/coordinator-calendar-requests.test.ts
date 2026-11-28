import { beforeEach, describe, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import { getCoordinatorCalendar } from "@/lib/client/coordinator-calendar";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const calls: ClientCall[] = [
  {
    title:
      "getCoordinatorCalendar reads every program's days without a program",
    call: () =>
      getCoordinatorCalendar({
        from: "2026-11-01",
        to: "2026-11-30",
        programId: null,
      }),
    method: "get",
    args: [
      "/api/coordinator/calendar",
      { params: { from: "2026-11-01", to: "2026-11-30" } },
    ],
  },
  {
    title: "getCoordinatorCalendar narrows to the chosen program",
    call: () =>
      getCoordinatorCalendar({
        from: "2026-11-01",
        to: "2026-11-30",
        programId: "prog-1",
      }),
    method: "get",
    args: [
      "/api/coordinator/calendar",
      { params: { from: "2026-11-01", to: "2026-11-30", programId: "prog-1" } },
    ],
  },
];

describe("coordinator calendar client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);
});
