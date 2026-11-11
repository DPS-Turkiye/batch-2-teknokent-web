import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getRatings } from "@/app/api/coordinator/programs/[id]/meeting-ratings/route";
import { GET as getReport } from "@/app/api/coordinator/programs/[id]/report/route";
import { UserRole } from "@/interfaces/session";
import {
  fetchProgramMeetingRatings,
  fetchProgramReport,
} from "@/lib/api/program-report";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/program-report", () => ({
  fetchProgramReport: vi.fn(),
  fetchProgramMeetingRatings: vi.fn(),
}));

vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorOrAdminSession: vi.fn(),
}));

const ok = { data: {}, headers: {}, status: 200 };
const params = { params: Promise.resolve({ id: "program-1" }) };

function signIn(role = UserRole.Coordinator) {
  vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue({
    ok: true,
    session: appSession({ userId: "user-1", role }),
  });
}

describe("program report routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("asks for the program report as the signed-in coordinator or admin", async () => {
    signIn(UserRole.Admin);
    vi.mocked(fetchProgramReport).mockResolvedValue(
      ok as Awaited<ReturnType<typeof fetchProgramReport>>,
    );

    const response = await getReport(
      new Request("http://localhost/api/coordinator/programs/program-1/report"),
      params,
    );

    expect(response.status).toBe(200);
    expect(fetchProgramReport).toHaveBeenCalledWith("user-1", "program-1");
  });

  it("passes the ratings window, or none for the whole program", async () => {
    signIn();
    vi.mocked(fetchProgramMeetingRatings).mockResolvedValue(
      ok as Awaited<ReturnType<typeof fetchProgramMeetingRatings>>,
    );

    await getRatings(
      new NextRequest(
        "http://localhost/api/coordinator/programs/program-1/meeting-ratings?from=2026-08-03",
      ),
      params,
    );
    await getRatings(
      new NextRequest(
        "http://localhost/api/coordinator/programs/program-1/meeting-ratings",
      ),
      params,
    );

    expect(fetchProgramMeetingRatings).toHaveBeenNthCalledWith(
      1,
      "user-1",
      "program-1",
      "2026-08-03",
    );
    expect(fetchProgramMeetingRatings).toHaveBeenNthCalledWith(
      2,
      "user-1",
      "program-1",
      null,
    );
  });

  it("rejects a malformed window before calling the backend", async () => {
    signIn();

    const response = await getRatings(
      new NextRequest(
        "http://localhost/api/coordinator/programs/program-1/meeting-ratings?from=last-week",
      ),
      params,
    );

    expect(response.status).toBe(400);
    expect(fetchProgramMeetingRatings).not.toHaveBeenCalled();
  });
});
