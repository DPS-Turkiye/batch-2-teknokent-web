import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/coordinator/overview/route";
import { type AppSession, UserRole } from "@/interfaces/session";
import { fetchCoordinatorOverview } from "@/lib/api/coordinator-overview";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

vi.mock("@/lib/api/coordinator-overview", () => ({
  fetchCoordinatorOverview: vi.fn(),
}));

vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorSession: vi.fn(),
}));

function get(query = "") {
  return GET(
    new NextRequest(`http://localhost/api/coordinator/overview${query}`),
  );
}

describe("GET /api/coordinator/overview", () => {
  beforeEach(() => vi.clearAllMocks());

  it("asks as the signed-in coordinator and passes the program through", async () => {
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: true,
      session: {
        userId: "coordinator-1",
        role: UserRole.Coordinator,
      } as AppSession,
    });
    vi.mocked(fetchCoordinatorOverview).mockResolvedValue({
      data: {},
      headers: {},
      status: 200,
    } as Awaited<ReturnType<typeof fetchCoordinatorOverview>>);

    expect((await get("?programId=program-1")).status).toBe(200);
    expect(fetchCoordinatorOverview).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
    );

    await get();
    expect(fetchCoordinatorOverview).toHaveBeenLastCalledWith(
      "coordinator-1",
      null,
    );
  });

  it("stops at the session check", async () => {
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ code: "FORBIDDEN" }, { status: 403 }),
    });

    expect((await get()).status).toBe(403);
    expect(fetchCoordinatorOverview).not.toHaveBeenCalled();
  });
});
