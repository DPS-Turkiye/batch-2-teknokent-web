import { beforeEach, describe, expect, it, vi } from "vitest";

import { SessionsExportFormat } from "@/interfaces/program-report";
import { backendHttp } from "@/lib/client/backend-http";
import { downloadBackendFile } from "@/lib/client/download";
import {
  downloadProgramSessions,
  getProgramMeetingFeedback,
  getProgramMeetingRatings,
  getProgramReport,
  getProgramSessions,
} from "@/lib/client/program-report";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);
vi.mock("@/lib/client/download", () => ({ downloadBackendFile: vi.fn() }));

const P = "/api/coordinator/programs/prog%2F1";

const calls: ClientCall[] = [
  {
    title: "getProgramReport reads the encoded program's report",
    call: () => getProgramReport("prog/1"),
    method: "get",
    args: [`${P}/report`],
  },
  {
    title: "getProgramMeetingRatings counts every held meeting without a day",
    call: () => getProgramMeetingRatings("prog/1", null),
    method: "get",
    args: [`${P}/meeting-ratings`, { params: undefined }],
  },
  {
    title: "getProgramMeetingRatings counts from the chosen day",
    call: () => getProgramMeetingRatings("prog/1", "2026-11-01"),
    method: "get",
    args: [`${P}/meeting-ratings`, { params: { from: "2026-11-01" } }],
  },
  {
    title: "getProgramMeetingFeedback asks for a page of twenty",
    call: () => getProgramMeetingFeedback("prog/1", { from: null, page: 2 }),
    method: "get",
    args: [`${P}/meeting-feedback`, { params: { page: 2, size: 20 } }],
  },
  {
    title: "getProgramMeetingFeedback narrows to the chosen day",
    call: () =>
      getProgramMeetingFeedback("prog/1", { from: "2026-11-01", page: 0 }),
    method: "get",
    args: [
      `${P}/meeting-feedback`,
      { params: { from: "2026-11-01", page: 0, size: 20 } },
    ],
  },
  {
    title: "getProgramSessions reads the chosen days",
    call: () => getProgramSessions("prog/1", "2026-11-01", "2026-11-30"),
    method: "get",
    args: [
      `${P}/sessions`,
      { params: { from: "2026-11-01", to: "2026-11-30" } },
    ],
  },
];

describe("program report client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);

  it("downloads the sessions file of the chosen days, named as the backend names it", async () => {
    await downloadProgramSessions("prog/1", {
      from: "2026-11-01",
      to: "2026-11-30",
      format: SessionsExportFormat.Xlsx,
    });

    expect(downloadBackendFile).toHaveBeenCalledWith(
      `${P}/sessions/export`,
      {
        from: "2026-11-01",
        to: "2026-11-30",
        format: SessionsExportFormat.Xlsx,
      },
      "gorusmeler-2026-11-01-2026-11-30.xlsx",
    );
  });
});
