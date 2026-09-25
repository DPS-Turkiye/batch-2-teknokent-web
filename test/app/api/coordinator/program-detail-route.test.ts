import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT as archive } from "@/app/api/coordinator/programs/[id]/archive/route";
import { DELETE as removeCoordinator } from "@/app/api/coordinator/programs/[id]/coordinators/[userId]/route";
import { POST as addCoordinator } from "@/app/api/coordinator/programs/[id]/coordinators/route";
import { PUT as phases } from "@/app/api/coordinator/programs/[id]/phases/route";
import { GET, PUT } from "@/app/api/coordinator/programs/[id]/route";
import { type AppSession, UserRole } from "@/interfaces/session";
import * as api from "@/lib/api/coordinator-programs";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

vi.mock("@/lib/api/coordinator-programs", () => ({
  fetchCoordinatorProgram: vi.fn(),
  updateCoordinatorProgram: vi.fn(),
  replaceCoordinatorProgramPhases: vi.fn(),
  setCoordinatorProgramArchived: vi.fn(),
  fetchProgramCoordinators: vi.fn(),
  addProgramCoordinator: vi.fn(),
  removeProgramCoordinator: vi.fn(),
}));
vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorSession: vi.fn(),
}));

const ok = { data: {}, headers: {}, status: 200 } as never;
const params = { params: Promise.resolve({ id: "program-1" }) };
const body = (value: unknown) =>
  new Request("http://localhost", {
    method: "PUT",
    body: JSON.stringify(value),
  });

describe("coordinator program detail routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: true,
      session: {
        userId: "coordinator-1",
        role: UserRole.Coordinator,
      } as AppSession,
    });
    for (const fn of Object.values(api)) vi.mocked(fn).mockResolvedValue(ok);
  });

  it("reads and saves the program as the signed-in coordinator", async () => {
    await GET(new Request("http://localhost"), params);
    expect(api.fetchCoordinatorProgram).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
    );

    await PUT(
      body({
        name: "METU",
        meetingFrequencyDays: "10",
        staleAfterDays: 20,
        meetingNoteRequired: true,
        bottleneckFlagDays: "30",
        actorId: "someone-else",
      }),
      params,
    );
    expect(api.updateCoordinatorProgram).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      {
        name: "METU",
        description: null,
        startDate: null,
        endDate: null,
        meetingFrequencyDays: 10,
        staleAfterDays: 20,
        meetingNoteRequired: true,
        autoMatchSuggestions: false,
        bottleneckFlagDays: 30,
      },
    );
  });

  it("forwards phases, archiving and coordinator changes", async () => {
    await phases(body({ phases: [{ name: "Başvuru", extra: "x" }] }), params);
    expect(api.replaceCoordinatorProgramPhases).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      [{ name: "Başvuru", startDate: null, endDate: null }],
    );
    await archive(body({ archived: true }), params);
    expect(api.setCoordinatorProgramArchived).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      true,
    );
    await addCoordinator(body({ userId: "coordinator-2" }), params);
    expect(api.addProgramCoordinator).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "coordinator-2",
    );
    await removeCoordinator(new Request("http://localhost"), {
      params: Promise.resolve({ id: "program-1", userId: "coordinator-2" }),
    });
    expect(api.removeProgramCoordinator).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "coordinator-2",
    );
  });

  it("stops at the session check", async () => {
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ code: "FORBIDDEN" }, { status: 403 }),
    });
    expect((await archive(body({ archived: true }), params)).status).toBe(403);
    expect(api.setCoordinatorProgramArchived).not.toHaveBeenCalled();
  });
});
