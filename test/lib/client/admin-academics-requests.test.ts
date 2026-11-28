import { beforeEach, describe, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import { getProgramAcademics } from "@/lib/client/admin-academics";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

// An id with a slash and a space proves the path segment is encoded.
const PROGRAM = "prog/1 a";
const P = "/api/coordinator/programs/prog%2F1%20a";

const calls: ClientCall[] = [
  {
    title: "getProgramAcademics lists the program's academicians",
    call: () => getProgramAcademics(PROGRAM),
    method: "get",
    args: [`${P}/academics`],
  },
];

describe("admin academics client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);
});
