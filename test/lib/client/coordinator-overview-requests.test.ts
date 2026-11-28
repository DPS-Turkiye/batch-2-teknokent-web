import { beforeEach, describe, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import { getCoordinatorOverview } from "@/lib/client/coordinator-overview";
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
      "getCoordinatorOverview reads every running program without a program",
    call: () => getCoordinatorOverview(null),
    method: "get",
    args: ["/api/coordinator/overview", { params: undefined }],
  },
  {
    title: "getCoordinatorOverview narrows to the chosen program",
    call: () => getCoordinatorOverview("prog-1"),
    method: "get",
    args: ["/api/coordinator/overview", { params: { programId: "prog-1" } }],
  },
];

describe("coordinator overview client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);
});
