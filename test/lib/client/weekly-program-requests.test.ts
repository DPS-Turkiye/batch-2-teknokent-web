import { describe, vi } from "vitest";

import {
  readWeeklyProgram,
  saveWeeklyProgram,
} from "@/lib/client/weekly-program";
import { UPLOAD_TIMEOUT_MS } from "@/lib/http-client";
import { backendHttp } from "@/lib/client/backend-http";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const input = {
  documentId: "doc-1",
  weeks: [],
  specialDays: [],
  phases: [
    {
      name: "Problemi Keşfet",
      expectedOutput: null,
      firstWeek: 1,
      lastWeek: 3,
    },
  ],
  seenPhaseCount: 0,
  seenWeekCount: 0,
  keepPast: true,
};

const calls: ClientCall[] = [
  {
    title:
      "readWeeklyProgram reads the encoded program's file with an upload's timeout, naming nobody",
    call: () => readWeeklyProgram("prog/1", "doc-1"),
    method: "post",
    args: [
      "/api/coordinator/programs/prog%2F1/weekly-program/read",
      { documentId: "doc-1" },
      { timeout: UPLOAD_TIMEOUT_MS },
    ],
  },
  {
    title: "saveWeeklyProgram puts the reviewed plan",
    call: () => saveWeeklyProgram("prog/1", input),
    method: "put",
    args: ["/api/coordinator/programs/prog%2F1/weekly-program", input],
  },
];

describe("weekly program client", () => {
  itSendsEachClientCall(calls, backendHttp);
});
