import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as exportFile } from "@/app/api/coordinator/programs/[id]/attendance/export/route";
import { GET } from "@/app/api/coordinator/programs/[id]/attendance/route";
import { SessionsExportFormat } from "@/interfaces/program-report";
import { UserRole } from "@/interfaces/session";
import {
  exportProgramAttendance,
  fetchProgramAttendance,
} from "@/lib/api/program-attendance";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";
import { answerEachWith, guardRefusal } from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/program-attendance", () => ({
  fetchProgramAttendance: vi.fn(),
  exportProgramAttendance: vi.fn(),
}));

vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorSession: vi.fn(),
}));

const params = { params: Promise.resolve({ id: "program-1" }) };
const url = "http://localhost/api/coordinator/programs/program-1/attendance";

describe("coordinator attendance routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: true,
      session: appSession({ userId: "coord-1", role: UserRole.Coordinator }),
    });
    answerEachWith([fetchProgramAttendance]);
    vi.mocked(exportProgramAttendance).mockResolvedValue({
      data: new ArrayBuffer(3),
      headers: {
        "content-type": "text/csv; charset=UTF-8",
        "content-disposition": 'attachment; filename="katilim.csv"',
      },
      status: 200,
    });
  });

  it("covers the whole program without dates, or the chosen range", async () => {
    await GET(new NextRequest(url), params);
    await GET(new NextRequest(`${url}?from=2026-11-02&to=2026-11-12`), params);

    expect(fetchProgramAttendance).toHaveBeenNthCalledWith(
      1,
      "coord-1",
      "program-1",
      null,
    );
    expect(fetchProgramAttendance).toHaveBeenNthCalledWith(
      2,
      "coord-1",
      "program-1",
      {
        from: "2026-11-02",
        to: "2026-11-12",
      },
    );
  });

  it("refuses half a range or a malformed day", async () => {
    for (const query of [
      "?from=2026-11-02",
      "?to=2026-11-12",
      "?from=x&to=2026-11-12",
    ]) {
      expect(
        (await GET(new NextRequest(`${url}${query}`), params)).status,
      ).toBe(400);
    }
    expect(fetchProgramAttendance).not.toHaveBeenCalled();
  });

  it("streams the file in the format asked for", async () => {
    const response = await exportFile(
      new NextRequest(`${url}/export?format=CSV`),
      params,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain(
      "katilim.csv",
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(exportProgramAttendance).toHaveBeenCalledWith(
      "coord-1",
      "program-1",
      {
        range: null,
        format: SessionsExportFormat.Csv,
      },
    );
  });

  it("refuses an unknown format", async () => {
    const response = await exportFile(
      new NextRequest(`${url}/export?format=PDF`),
      params,
    );

    expect(response.status).toBe(400);
    expect(exportProgramAttendance).not.toHaveBeenCalled();
  });

  it("stops anyone who is not a coordinator or admin", async () => {
    vi.mocked(requireCoordinatorSession).mockResolvedValue(guardRefusal(403));

    expect((await GET(new NextRequest(url), params)).status).toBe(403);
    expect(
      (await exportFile(new NextRequest(`${url}/export?format=CSV`), params))
        .status,
    ).toBe(403);
    expect(fetchProgramAttendance).not.toHaveBeenCalled();
  });
});
