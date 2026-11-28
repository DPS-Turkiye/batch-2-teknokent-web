import { beforeEach, describe, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import {
  getStartupProcess,
  getTeamProcess,
  submitAssignment,
  withdrawSubmission,
} from "@/lib/client/startup-process";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);
vi.mock("@/lib/client/own-organization", async () =>
  (await import("@test/mocks/own-organization")).ownOrganizationMock(),
);
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
    args: [`/api/organizations/org%2F1/process`],
  },
  {
    title:
      "submitAssignment puts the document as the encoded assignment's submission",
    call: () => submitAssignment("as/1", "doc-1"),
    method: "put",
    args: [
      "/api/organizations/org%2F1/process/assignments/as%2F1/submission",
      { documentId: "doc-1" },
    ],
  },
  {
    title: "submitAssignment sends a null document to mark an Ödev done",
    call: () => submitAssignment("as/1", null),
    method: "put",
    args: [
      "/api/organizations/org%2F1/process/assignments/as%2F1/submission",
      { documentId: null },
    ],
  },
  {
    title: "withdrawSubmission deletes the encoded assignment's submission",
    call: () => withdrawSubmission("as/1"),
    method: "delete",
    args: ["/api/organizations/org%2F1/process/assignments/as%2F1/submission"],
  },
];

const proxyCalls: ClientCall[] = [
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

  itSendsEachClientCall(calls, backendHttp);
  itSendsEachClientCall(proxyCalls);
});
