import { beforeEach, describe, expect, it, vi } from "vitest";

import { SessionsExportFormat } from "@/interfaces/program-report";
import {
  checkInMyAttendance,
  exportProgramAttendance,
  fetchMyAttendance,
  fetchProgramAttendance,
} from "@/lib/api/program-attendance";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";
import { itemAt } from "@test/fixtures/list-assertions";

vi.mock("@/lib/server/backend-client", () => ({ backendRequest: vi.fn() }));

describe("program attendance server API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads and writes the session user's own check-in", async () => {
    await fetchMyAttendance("mentee-1");
    await checkInMyAttendance("mentee-1", 2);

    expect(backendRequest).toHaveBeenNthCalledWith(1, {
      method: HttpMethod.Get,
      url: "/api/programs/mine/attendance",
      params: { actorId: "mentee-1" },
    });
    expect(backendRequest).toHaveBeenNthCalledWith(2, {
      method: HttpMethod.Post,
      url: "/api/programs/mine/attendance",
      data: { actorId: "mentee-1", week: 2 },
    });
  });

  it("asks for the report as the coordinator, with or without a range", async () => {
    await fetchProgramAttendance("coord-1", "program-1", null);
    await exportProgramAttendance("coord-1", "program-1", {
      range: { from: "2026-11-02", to: "2026-11-12" },
      format: SessionsExportFormat.Xlsx,
    });

    expect(itemAt(vi.mocked(backendRequest).mock.calls, 0)[0]).toMatchObject({
      url: "/api/coordinator/programs/program-1/attendance",
      params: { actorId: "coord-1" },
    });
    expect(itemAt(vi.mocked(backendRequest).mock.calls, 1)[0]).toMatchObject({
      url: "/api/coordinator/programs/program-1/attendance/export",
      params: {
        actorId: "coord-1",
        from: "2026-11-02",
        to: "2026-11-12",
        format: "XLSX",
      },
      responseType: "arraybuffer",
    });
  });
});
