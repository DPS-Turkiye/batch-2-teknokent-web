import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/coordinator/programs/route";
import { UserRole, type AppSession } from "@/interfaces/session";
import { fetchCoordinatorPrograms } from "@/lib/api/coordinator-programs";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";
import { guardRefusal } from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/coordinator-programs", () => ({
  fetchCoordinatorPrograms: vi.fn(),
}));

vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorSession: vi.fn(),
}));

function coordinatorSession(): AppSession {
  return appSession({
    userId: "coordinator-1",
    email: "elif@tekno.test",
    fullName: "Elif Demir",
    role: UserRole.Coordinator,
  });
}

describe("GET /api/coordinator/programs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("asks the backend as the signed-in coordinator", async () => {
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: true,
      session: coordinatorSession(),
    });
    vi.mocked(fetchCoordinatorPrograms).mockResolvedValue({
      data: [],
      headers: {},
      status: 200,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(fetchCoordinatorPrograms).toHaveBeenCalledWith("coordinator-1");
  });

  it("stops at the session check", async () => {
    vi.mocked(requireCoordinatorSession).mockResolvedValue(guardRefusal(403));

    const response = await GET();

    expect(response.status).toBe(403);
    expect(fetchCoordinatorPrograms).not.toHaveBeenCalled();
  });
});
