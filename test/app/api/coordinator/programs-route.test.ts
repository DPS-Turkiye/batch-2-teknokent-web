import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/coordinator/programs/route";
import { type AppSession, UserRole } from "@/interfaces/session";
import { fetchCoordinatorPrograms } from "@/lib/api/coordinator-programs";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

vi.mock("@/lib/api/coordinator-programs", () => ({
  fetchCoordinatorPrograms: vi.fn(),
}));

vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorSession: vi.fn(),
}));

function coordinatorSession(): AppSession {
  return {
    userId: "coordinator-1",
    email: "elif@tekno.test",
    fullName: "Elif Demir",
    jobTitle: null,
    role: UserRole.Coordinator,
  } as AppSession;
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
    } as Awaited<ReturnType<typeof fetchCoordinatorPrograms>>);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(fetchCoordinatorPrograms).toHaveBeenCalledWith("coordinator-1");
  });

  it("stops at the session check", async () => {
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ code: "FORBIDDEN" }, { status: 403 }),
    });

    const response = await GET();

    expect(response.status).toBe(403);
    expect(fetchCoordinatorPrograms).not.toHaveBeenCalled();
  });
});
