import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT as archive } from "@/app/api/coordinator/programs/[id]/archive/route";
import { DELETE as removeCoordinator } from "@/app/api/coordinator/programs/[id]/coordinators/[userId]/route";
import { POST as addCoordinator } from "@/app/api/coordinator/programs/[id]/coordinators/route";
import { PUT as phases } from "@/app/api/coordinator/programs/[id]/phases/route";
import { GET, PUT } from "@/app/api/coordinator/programs/[id]/route";
import { UserRole } from "@/interfaces/session";
import * as api from "@/lib/api/coordinator-programs";
import { requireAdminSession } from "@/lib/server/require-admin";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
import { answerEachWith, guardRefusal } from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/coordinator-programs", () => ({
  fetchCoordinatorProgram: vi.fn(),
  updateCoordinatorProgram: vi.fn(),
  replaceCoordinatorProgramPhases: vi.fn(),
  setCoordinatorProgramArchived: vi.fn(),
  fetchProgramCoordinators: vi.fn(),
  addProgramCoordinator: vi.fn(),
  removeProgramCoordinator: vi.fn(),
}));
vi.mock("@/lib/server/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));
vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorOrAdminSession: vi.fn(),
}));

const params = { params: Promise.resolve({ id: "program-1" }) };
const COORDINATOR_ID = "5d0c1e6a-0f43-4c4b-9a54-6f2d6c1b7e21";

const body = (value: unknown) =>
  new Request("http://localhost", {
    method: "PUT",
    body: JSON.stringify(value),
  });

describe("coordinator program detail routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue({
      ok: true,
      session: appSession({
        userId: "coordinator-1",
        role: UserRole.Coordinator,
      }),
    });
    answerEachWith(Object.values(api));
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
        meetingFrequencyDays: 10,
        staleAfterDays: 20,
        meetingNoteRequired: true,
        autoMatchSuggestions: false,
        bottleneckFlagDays: 30,
        eligibleEmailDomain: null,
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
    await phases(
      body({
        phases: [{ name: "Başvuru", expectedOutput: "Form", extra: "x" }],
        syllabusDocumentId: "doc-1",
      }),
      params,
    );
    expect(api.replaceCoordinatorProgramPhases).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      [
        {
          name: "Başvuru",
          startDate: null,
          endDate: null,
          expectedOutput: "Form",
        },
      ],
      "doc-1",
    );
    await archive(body({ archived: true }), params);
    expect(api.setCoordinatorProgramArchived).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      true,
    );
  });

  it("adds, invites and removes coordinators only as the signed-in admin", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue({
      ok: true,
      session: appSession({ userId: "admin-1", role: UserRole.Admin }),
    });
    await addCoordinator(body({ userId: COORDINATOR_ID }), params);
    expect(api.addProgramCoordinator).toHaveBeenCalledWith(
      "admin-1",
      "program-1",
      { userId: COORDINATOR_ID },
    );
    await addCoordinator(
      body({
        invite: { fullName: "Yeni Kişi", email: "yeni@x.org" },
        actorId: "someone-else",
      }),
      params,
    );
    expect(api.addProgramCoordinator).toHaveBeenLastCalledWith(
      "admin-1",
      "program-1",
      { invite: { fullName: "Yeni Kişi", email: "yeni@x.org" } },
    );
    await removeCoordinator(new Request("http://localhost"), {
      params: Promise.resolve({ id: "program-1", userId: COORDINATOR_ID }),
    });
    expect(api.removeProgramCoordinator).toHaveBeenCalledWith(
      "admin-1",
      "program-1",
      COORDINATOR_ID,
    );
  });

  it("refuses a coordinator who tries to add or remove a coordinator", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue(guardRefusal(403));

    expect(
      (await addCoordinator(body({ userId: COORDINATOR_ID }), params)).status,
    ).toBe(403);
    expect(
      (
        await removeCoordinator(new Request("http://localhost"), {
          params: Promise.resolve({ id: "program-1", userId: COORDINATOR_ID }),
        })
      ).status,
    ).toBe(403);
    expect(api.addProgramCoordinator).not.toHaveBeenCalled();
    expect(api.removeProgramCoordinator).not.toHaveBeenCalled();
  });

  it("stops at the session check", async () => {
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue(
      guardRefusal(403),
    );
    expect((await archive(body({ archived: true }), params)).status).toBe(403);
    expect(api.setCoordinatorProgramArchived).not.toHaveBeenCalled();
  });
});
