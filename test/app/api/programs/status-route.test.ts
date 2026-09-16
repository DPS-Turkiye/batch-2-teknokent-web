import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT } from "@/app/api/programs/[id]/status/route";
import { ProgramStatus } from "@/interfaces/program";
import { UserRole, type AppSession } from "@/interfaces/session";
import { updateProgramStatus } from "@/lib/api/programs";
import { requireCoordinatorSession } from "@/lib/server/require-program-access";

vi.mock("@/lib/api/programs", () => ({ updateProgramStatus: vi.fn() }));

vi.mock("@/lib/server/require-program-access", () => ({
  requireCoordinatorSession: vi.fn(),
}));

function coordinatorSession(): AppSession {
  return {
    userId: "coord-1",
    email: "coordinator@teknokent.demo",
    fullName: "Demo Coordinator",
    jobTitle: "Koordinatör",
    role: UserRole.Coordinator,
  };
}

function statusRequest(body: unknown) {
  return new NextRequest("http://localhost/api/programs/prog-1/status", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

const context = { params: Promise.resolve({ id: "prog-1" }) };

beforeEach(() => vi.clearAllMocks());

describe("PUT /api/programs/[id]/status", () => {
  it("refuses a caller who is not a coordinator", async () => {
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ code: "FORBIDDEN" }, { status: 403 }),
    });

    const response = await PUT(
      statusRequest({ status: ProgramStatus.Completed }),
      context,
    );

    expect(response.status).toBe(403);
    expect(updateProgramStatus).not.toHaveBeenCalled();
  });

  it("rejects a status the backend does not know", async () => {
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: true,
      session: coordinatorSession(),
    });

    const response = await PUT(statusRequest({ status: "PAUSED" }), context);

    expect(response.status).toBe(400);
    expect(updateProgramStatus).not.toHaveBeenCalled();
  });

  it("forwards the new status with the session user as the actor", async () => {
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: true,
      session: coordinatorSession(),
    });
    vi.mocked(updateProgramStatus).mockResolvedValue({
      data: { id: "prog-1", status: ProgramStatus.Completed },
      headers: {},
      status: 200,
    } as unknown as Awaited<ReturnType<typeof updateProgramStatus>>);

    const response = await PUT(
      statusRequest({ status: ProgramStatus.Completed }),
      context,
    );

    expect(response.status).toBe(200);
    expect(updateProgramStatus).toHaveBeenCalledWith(
      "coord-1",
      "prog-1",
      ProgramStatus.Completed,
    );
    expect(await response.json()).toMatchObject({
      status: ProgramStatus.Completed,
    });
  });
});
