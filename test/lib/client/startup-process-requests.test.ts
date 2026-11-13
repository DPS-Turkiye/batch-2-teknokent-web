import { beforeEach, describe, vi } from "vitest";

import {
  getStartupProcess,
  getTeamProcess,
  submitAssignment,
} from "@/lib/client/startup-process";
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

const STAGE = "/api/coordinator/programs/prog%2F1/team-details/org%2F1/stage";

const calls: ClientCall[] = [
  {
    title: "getStartupProcess reads the startup's own process",
    call: () => getStartupProcess(),
    method: "get",
    args: ["/api/startup/process"],
  },
  {
    title:
      "submitAssignment puts the document as the encoded assignment's submission",
    call: () => submitAssignment("as/1", "doc-1"),
    method: "put",
    args: [
      "/api/startup/process/assignments/as%2F1/submission",
      { documentId: "doc-1" },
    ],
  },
  {
    title: "getTeamProcess reads a program team's process",
    call: () => getTeamProcess("prog/1", "org/1"),
    method: "get",
    args: [STAGE],
  },
];

describe("startup process client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls);
});
