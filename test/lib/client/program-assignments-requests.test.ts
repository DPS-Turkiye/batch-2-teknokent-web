import { beforeEach, describe, vi } from "vitest";

import {
  createProgramAssignment,
  deleteProgramAssignment,
  getProgramAssignments,
  updateProgramAssignment,
} from "@/lib/client/program-assignments";
import { backendHttp } from "@/lib/client/backend-http";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const input = {
  title: "Pazar araştırması",
  description: "Hedef pazarı anlat.",
  dueDate: null,
  phaseId: null,
  fileRequired: false,
};

const calls: ClientCall[] = [
  {
    title: "getProgramAssignments reads an encoded program's Ödevler",
    call: () => getProgramAssignments("prog/1"),
    method: "get",
    args: ["/api/coordinator/programs/prog%2F1/assignments"],
  },
  {
    title: "createProgramAssignment posts the Ödev for every team",
    call: () => createProgramAssignment("prog/1", input),
    method: "post",
    args: ["/api/coordinator/programs/prog%2F1/assignments", input],
  },
  {
    title: "updateProgramAssignment puts the edited Ödev",
    call: () =>
      updateProgramAssignment("prog/1", "odev/1", {
        title: "Pazar analizi",
        description: null,
        dueDate: "2026-12-05",
      }),
    method: "put",
    args: [
      "/api/coordinator/programs/prog%2F1/assignments/odev%2F1",
      { title: "Pazar analizi", description: null, dueDate: "2026-12-05" },
    ],
  },
  {
    title: "deleteProgramAssignment removes the Ödev",
    call: () => deleteProgramAssignment("prog/1", "odev/1"),
    method: "delete",
    args: ["/api/coordinator/programs/prog%2F1/assignments/odev%2F1"],
    returnsNothing: true,
  },
];

describe("program assignments client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);
});
