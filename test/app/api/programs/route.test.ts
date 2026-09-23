import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/programs/route";
import { createProgram, fetchPrograms } from "@/lib/api/programs";
import { requireCoordinatorOrMentorSession } from "@/lib/server/require-program-access";
import { getSessionUser } from "@/lib/session";
import { UserRole, type AppSession } from "@/interfaces/session";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/api/programs", () => ({
  fetchPrograms: vi.fn(),
  createProgram: vi.fn(),
}));

vi.mock("@/lib/server/require-program-access", () => ({
  requireCoordinatorOrMentorSession: vi.fn(),
  requireCoordinatorSession: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionUser: vi.fn(),
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

describe("GET /api/programs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a missing session", async () => {
    vi.mocked(requireCoordinatorOrMentorSession).mockResolvedValue({
      ok: false,
      response: NextResponse.json(
        { code: "SESSION_REQUIRED" },
        { status: 401 },
      ),
    });

    const response = await GET();
    expect(response.status).toBe(401);
    expect(fetchPrograms).not.toHaveBeenCalled();
  });

  it("loads programs for the signed-in coordinator", async () => {
    vi.mocked(requireCoordinatorOrMentorSession).mockResolvedValue({
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

describe("POST /api/programs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a program for the coordinator session", async () => {
    const { requireCoordinatorSession } =
      await import("@/lib/server/require-program-access");
    vi.mocked(getSessionUser).mockResolvedValue(coordinatorSession());
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: true,
      session: coordinatorSession(),
    });
    vi.mocked(createProgram).mockResolvedValue({
      data: {
        id: "program-1",
        name: "Seed 2026",
        coordinatorId: "coord-1",
        coordinatorName: "Demo Coordinator",
        createdAt: "2026-09-01T08:00:00Z",
        startups: [],
        mentors: [],
      },
      headers: {},
      status: 201,
    });

    const response = await POST(
      new NextRequest("http://localhost/api/programs", {
        method: "POST",
        body: JSON.stringify({ name: "Seed 2026" }),
      }),
    );

    expect(response.status).toBe(201);
    expect(createProgram).toHaveBeenCalledWith("coord-1", "Seed 2026");
  });
});
