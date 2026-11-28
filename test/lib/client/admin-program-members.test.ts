import { beforeEach, describe, vi } from "vitest";

import { ProgramMemberKind } from "@/interfaces/admin-overview";
import {
  assignToProgram,
  moveStartupToProgram,
  removeMentorFromProgram,
} from "@/lib/client/admin-program-members";
import { backendHttp } from "@/lib/client/backend-http";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const calls: ClientCall[] = [
  {
    title: "assignToProgram puts a member in under the kind's path segment",
    call: () =>
      assignToProgram("prog/2", ProgramMemberKind.Mentors, "mentor 1"),
    method: "post",
    args: ["/api/admin/programs/prog%2F2/mentors/mentor%201"],
    returnsNothing: true,
  },
  {
    title:
      "moveStartupToProgram moves a startup into the program in the path, naming the one it leaves",
    call: () => moveStartupToProgram("prog/2", "org 1", "program-1"),
    method: "post",
    args: [
      "/api/admin/programs/prog%2F2/startups/org%201/move",
      { fromProgramId: "program-1" },
    ],
  },
  {
    title:
      "removeMentorFromProgram takes a mentor out of the program in the path",
    call: () => removeMentorFromProgram("prog/1", "mentor 1"),
    method: "post",
    args: ["/api/admin/programs/prog%2F1/mentors/mentor%201/remove"],
  },
];

describe("admin program members client, straight to the backend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);
});
