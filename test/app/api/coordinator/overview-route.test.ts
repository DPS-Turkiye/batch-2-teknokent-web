import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/coordinator/overview/route";
import { UserRole } from "@/interfaces/session";
import { fetchCoordinatorOverview } from "@/lib/api/coordinator-overview";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
import { guardRefusal } from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/coordinator-overview", () => ({
  fetchCoordinatorOverview: vi.fn(),
}));

vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorOrAdminSession: vi.fn(),
}));

function get(query = "") {
  return GET(
    new NextRequest(`http://localhost/api/coordinator/overview${query}`),
  );
}

describe("GET /api/coordinator/overview", () => {
  beforeEach(() => vi.clearAllMocks());

  it("asks as the signed-in coordinator and passes the program through", async () => {
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue({
      ok: true,
      session: appSession({
        userId: "coordinator-1",
        role: UserRole.Coordinator,
      }),
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
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue(
      guardRefusal(403),
    );

    expect((await get()).status).toBe(403);
    expect(fetchCoordinatorOverview).not.toHaveBeenCalled();
  });
});
