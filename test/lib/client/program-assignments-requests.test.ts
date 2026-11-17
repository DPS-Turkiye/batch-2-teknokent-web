import { beforeEach, describe, vi } from "vitest";

import {
  createProgramAssignment,
  getProgramAssignments,
} from "@/lib/client/program-assignments";
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
];

describe("program assignments client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls);
});
