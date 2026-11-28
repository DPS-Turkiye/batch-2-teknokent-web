import { beforeEach, describe, expect, it, vi } from "vitest";

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
import { createMentorResponse } from "@test/fixtures/mentors";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);
vi.mock("@/lib/client/own-organization", async () =>
  (await import("@test/mocks/own-organization")).ownOrganizationMock(),
);

const calls: ClientCall[] = [
  {
    title: "getStartupProcess reads the startup's own process",
    call: () => getStartupProcess(),
    method: "get",
    args: ["/api/organizations/org%2F1/process"],
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

describe("startup process client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);
});

describe("getTeamProcess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("looks the team up in the program, then reads its process from the backend", async () => {
    vi.mocked(backendHttp.get)
      .mockResolvedValueOnce(createMentorResponse({ organizationId: "org/1" }))
      .mockResolvedValueOnce(createMentorResponse({ phase: "Keşif" }));

    await expect(getTeamProcess("prog/1", "org/1")).resolves.toEqual({
      phase: "Keşif",
    });

    expect(backendHttp.get).toHaveBeenNthCalledWith(
      1,
      "/api/coordinator/programs/prog%2F1/team-details/org%2F1",
    );
    expect(backendHttp.get).toHaveBeenNthCalledWith(
      2,
      "/api/organizations/org%2F1/process",
    );
  });

  it("stops at the program's answer for a team that is not in it", async () => {
    vi.mocked(backendHttp.get).mockResolvedValueOnce(
      createMentorResponse({ message: "Bu takım bu programda değil." }, 404),
    );

    await expect(getTeamProcess("prog/1", "org/9")).rejects.toMatchObject({
      status: 404,
    });
    expect(backendHttp.get).toHaveBeenCalledTimes(1);
  });
});
