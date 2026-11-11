import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT } from "@/app/api/programs/mine/active/route";
import { GET } from "@/app/api/programs/mine/route";
import { GET as GET_NAMES } from "@/app/api/programs/names/route";
import type { OrganizationPrograms } from "@/interfaces/program";
import { UserRole, type AppSession } from "@/interfaces/session";
import {
  fetchOrganizationPrograms,
  fetchProgramNames,
  updateActiveProgram,
} from "@/lib/api/programs";
import { requireStartupSession } from "@/lib/server/require-program-access";
import { backendResponse, guardRefusal } from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/programs", () => ({
  fetchOrganizationPrograms: vi.fn(),
  updateActiveProgram: vi.fn(),
  fetchProgramNames: vi.fn(),
}));

vi.mock("@/lib/server/require-program-access", () => ({
  requireStartupSession: vi.fn(),
}));

function startupSession(): AppSession {
  return {
    userId: "mentee-1",
    email: "founder@novamed.demo",
    fullName: "Ayşe Kaya",
    jobTitle: "Kurucu",
    role: UserRole.Mentee,
    organizationId: "org-1",
  };
}

// backendRequest resolves an envelope, not the payload.
const PROGRAMS = backendResponse<OrganizationPrograms>({
  programs: [
    {
      id: "prog-1",
      name: "metustarts 2026",
      coordinatorName: "Demo Koordinatör",
      individualMentees: false,
    },
  ],
  activeProgramId: null,
});

function activeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/programs/mine/active", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/programs/mine", () => {
  it("refuses a caller who is not a startup member", async () => {
    vi.mocked(requireStartupSession).mockResolvedValue(guardRefusal(403));

    expect((await GET()).status).toBe(403);
    expect(fetchOrganizationPrograms).not.toHaveBeenCalled();
  });

  it("passes the session user through as the actor", async () => {
    vi.mocked(requireStartupSession).mockResolvedValue({
      ok: true,
      session: startupSession(),
    });
    vi.mocked(fetchOrganizationPrograms).mockResolvedValue(PROGRAMS);

    const response = await GET();

    expect(fetchOrganizationPrograms).toHaveBeenCalledWith("mentee-1");
    await expect(response.json()).resolves.toMatchObject({
      activeProgramId: null,
    });
  });
});

describe("PUT /api/programs/mine/active", () => {
  it("refuses a caller who is not a startup member", async () => {
    vi.mocked(requireStartupSession).mockResolvedValue(guardRefusal(403));

    expect((await PUT(activeRequest({ programId: "prog-1" }))).status).toBe(
      403,
    );
    expect(updateActiveProgram).not.toHaveBeenCalled();
  });

  it("forwards the chosen program", async () => {
    vi.mocked(requireStartupSession).mockResolvedValue({
      ok: true,
      session: startupSession(),
    });
    vi.mocked(updateActiveProgram).mockResolvedValue(PROGRAMS);

    await PUT(activeRequest({ programId: "prog-1" }));

    expect(updateActiveProgram).toHaveBeenCalledWith("mentee-1", "prog-1");
  });

  // Null is a real choice — it clears the active program — so it must reach the
  // backend as null rather than being dropped as a missing field.
  it("forwards an explicit null as a cleared choice", async () => {
    vi.mocked(requireStartupSession).mockResolvedValue({
      ok: true,
      session: startupSession(),
    });
    vi.mocked(updateActiveProgram).mockResolvedValue(PROGRAMS);

    await PUT(activeRequest({ programId: null }));

    expect(updateActiveProgram).toHaveBeenCalledWith("mentee-1", null);
  });

  it("treats a missing programId as a cleared choice, not undefined", async () => {
    vi.mocked(requireStartupSession).mockResolvedValue({
      ok: true,
      session: startupSession(),
    });
    vi.mocked(updateActiveProgram).mockResolvedValue(PROGRAMS);

    await PUT(activeRequest({}));

    expect(updateActiveProgram).toHaveBeenCalledWith("mentee-1", null);
  });
});

describe("GET /api/programs/names", () => {
  // Unlike /mine, this one must work with no session at all: the caller is
  // half-way through signup and has no account yet.
  it("serves the list without requiring a session", async () => {
    vi.mocked(fetchProgramNames).mockResolvedValue({
      data: [
        { id: "prog-1", name: "metustarts 2026", individualMentees: false },
      ],
      headers: {},
      status: 200,
    });

    const response = await GET_NAMES();

    expect(response.status).toBe(200);
    expect(requireStartupSession).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual([
      { id: "prog-1", name: "metustarts 2026", individualMentees: false },
    ]);
  });
});
