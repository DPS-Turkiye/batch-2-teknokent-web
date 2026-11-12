import { describe, vi } from "vitest";

import {
  readWeeklyProgram,
  saveWeeklyProgram,
} from "@/lib/client/weekly-program";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/http-client", () => ({
  UPLOAD_TIMEOUT_MS: 120_000,
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/client/bearer", () => ({
  bearerHeader: vi.fn().mockResolvedValue({ Authorization: "Bearer token-1" }),
}));

const input = {
  documentId: "doc-1",
  weeks: [],
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
      "readWeeklyProgram reads the encoded program's file with an upload's timeout",
    call: () => readWeeklyProgram("prog/1", "doc-1"),
    method: "post",
    args: [
      "/api/coordinator/programs/prog%2F1/weekly-program/read",
      { documentId: "doc-1" },
      { headers: { Authorization: "Bearer token-1" }, timeout: 120_000 },
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
  itSendsEachClientCall(calls);
});
