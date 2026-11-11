import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SessionsExportFormat } from "@/interfaces/program-report";
import {
  exportProgramSessions,
  fetchProgramMeetingRatings,
  fetchProgramReport,
  fetchProgramSessions,
} from "@/lib/api/program-report";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

type RequestCase = [
  description: string,
  call: () => Promise<unknown>,
  request: AxiosRequestConfig,
];

const cases: RequestCase[] = [
  [
    "reads an encoded program's report",
    () => fetchProgramReport("coord-1", "prog/1"),
    {
      method: "GET",
      url: "/api/coordinator/programs/prog%2F1/report",
      params: { actorId: "coord-1" },
    },
  ],
  [
    "reads meeting ratings for the whole program when no start is given",
    () => fetchProgramMeetingRatings("coord-1", "prog/1", null),
    {
      method: "GET",
      url: "/api/coordinator/programs/prog%2F1/meeting-ratings",
      params: { actorId: "coord-1" },
    },
  ],
  [
    "reads meeting ratings from the given day",
    () => fetchProgramMeetingRatings("coord-1", "prog/1", "2026-11-01"),
    {
      method: "GET",
      url: "/api/coordinator/programs/prog%2F1/meeting-ratings",
      params: { actorId: "coord-1", from: "2026-11-01" },
    },
  ],
  [
    "reads the sessions in the range",
    () => fetchProgramSessions("coord-1", "prog/1", "2026-11-01", "2026-11-30"),
    {
      method: "GET",
      url: "/api/coordinator/programs/prog%2F1/sessions",
      params: { actorId: "coord-1", from: "2026-11-01", to: "2026-11-30" },
    },
  ],
  [
    "downloads the sessions export as raw bytes of any type",
    () =>
      exportProgramSessions("coord-1", "prog/1", {
        from: "2026-11-01",
        to: "2026-11-30",
        format: SessionsExportFormat.Xlsx,
      }),
    {
      method: "GET",
      url: "/api/coordinator/programs/prog%2F1/sessions/export",
      params: {
        actorId: "coord-1",
        from: "2026-11-01",
        to: "2026-11-30",
        format: SessionsExportFormat.Xlsx,
      },
      responseType: "arraybuffer",
      headers: { Accept: "*/*" },
    },
  ],
];

describe("program report server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
