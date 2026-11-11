import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/programs/route";
import { UserRole, type AppSession } from "@/interfaces/session";
import { createProgram, fetchPrograms } from "@/lib/api/programs";
import { requireCoordinatorMentorOrAdminSession } from "@/lib/server/require-program-access";
import { getSessionUser } from "@/lib/session";
import { program } from "@test/fixtures/program";
import { backendResponse, guardRefusal } from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/programs", () => ({
  fetchPrograms: vi.fn(),
  createProgram: vi.fn(),
}));

vi.mock("@/lib/server/require-program-access", () => ({
  requireCoordinatorMentorOrAdminSession: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionUser: vi.fn(),
}));

function coordinatorSession(role = UserRole.Coordinator): AppSession {
  return {
    userId: "coord-1",
    email: "coordinator@teknokent.demo",
    fullName: "Demo Coordinator",
    jobTitle: "Koordinatör",
    role,
  };
}

describe("GET /api/programs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a missing session", async () => {
    vi.mocked(requireCoordinatorMentorOrAdminSession).mockResolvedValue(
      guardRefusal(401),
    );

    const response = await GET();
    expect(response.status).toBe(401);
    expect(fetchPrograms).not.toHaveBeenCalled();
  });

  it("loads programs for the signed-in coordinator", async () => {
    vi.mocked(requireCoordinatorMentorOrAdminSession).mockResolvedValue({
      ok: true,
      session: coordinatorSession(),
    });
    vi.mocked(fetchPrograms).mockResolvedValue({
      data: [],
      headers: {},
      status: 200,
    });

    const response = await GET();
    expect(response.status).toBe(200);
    expect(fetchPrograms).toHaveBeenCalledWith("coord-1");
  });
});

// The real guard runs here: only the session is mocked.
describe("POST /api/programs", () => {
  function create(name = "Seed 2026") {
    return POST(
      new NextRequest("http://localhost/api/programs", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createProgram).mockResolvedValue(
      backendResponse(program({ id: "program-1" }), 201),
    );
  });

  it.each([UserRole.Coordinator, UserRole.Admin])(
    "creates a program as the signed-in %s",
    async (role) => {
      vi.mocked(getSessionUser).mockResolvedValue(coordinatorSession(role));

      const response = await create();

      expect(response.status).toBe(201);
      expect(createProgram).toHaveBeenCalledWith("coord-1", "Seed 2026");
    },
  );

  it("refuses a mentor with the programs message", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(
      coordinatorSession(UserRole.Mentor),
    );

    const response = await create();

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      code: "FORBIDDEN",
      message: "Programları yalnızca koordinatörler yönetebilir.",
    });
    expect(createProgram).not.toHaveBeenCalled();
  });

  it("asks a visitor to sign in", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    expect((await create()).status).toBe(401);
    expect(createProgram).not.toHaveBeenCalled();
  });
});
