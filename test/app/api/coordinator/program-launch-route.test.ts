import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as teamDetail } from "@/app/api/coordinator/programs/[id]/team-details/[organizationId]/route";
import {
  DELETE,
  PUT,
} from "@/app/api/coordinator/programs/[id]/teams/[inviteId]/route";
import { POST as sendCode } from "@/app/api/coordinator/programs/[id]/teams/[inviteId]/send-code/route";
import {
  POST as addTeams,
  GET as listTeams,
} from "@/app/api/coordinator/programs/[id]/teams/route";
import { POST as create } from "@/app/api/coordinator/programs/route";
import { ProgramType } from "@/interfaces/program";
import { UserRole } from "@/interfaces/session";
import * as api from "@/lib/api/coordinator-programs";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
import {
  answerEachWith,
  backendResponse,
  guardRefusal,
} from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/coordinator-programs", () => ({
  fetchCoordinatorPrograms: vi.fn(),
  createCoordinatorProgram: vi.fn(),
  fetchProgramTeams: vi.fn(),
  addProgramTeams: vi.fn(),
  updateProgramTeam: vi.fn(),
  removeProgramTeam: vi.fn(),
  sendProgramTeamCode: vi.fn(),
  fetchProgramTeamDetail: vi.fn(),
}));
vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorOrAdminSession: vi.fn(),
}));

const ok = backendResponse([]);
const teamParams = { params: Promise.resolve({ id: "program-1" }) };
const inviteParams = {
  params: Promise.resolve({ id: "program-1", inviteId: "invite-1" }),
};
const request = (method: string, value: unknown) =>
  new Request("http://localhost", { method, body: JSON.stringify(value) });

describe("coordinator program launch routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue({
      ok: true,
      session: appSession({
        userId: "coordinator-1",
        role: UserRole.Coordinator,
      }),
    });
    for (const fn of [
      api.createCoordinatorProgram,
      api.fetchProgramTeams,
      api.addProgramTeams,
      api.updateProgramTeam,
      api.removeProgramTeam,
      api.sendProgramTeamCode,
      api.fetchProgramTeamDetail,
    ]) {
      answerEachWith([fn], ok);
    }
  });

  it("creates a program as the signed-in coordinator", async () => {
    const response = await create(
      request("POST", {
        type: "PEER_MENTORING",
        name: "METU BİGG 2026",
        startDate: "2026-09-01",
        coordinatorIds: ["coordinator-2"],
        meetingFrequencyDays: 14,
        defaultMentorCapacity: null,
        teams: [{ teamName: "Kavşak", leadEmail: "deniz@kavsak.co" }],
        unknownField: "dropped",
      }),
    );

    expect(response.status).toBe(200);
    expect(api.createCoordinatorProgram).toHaveBeenCalledWith("coordinator-1", {
      type: ProgramType.PeerMentoring,
      name: "METU BİGG 2026",
      description: null,
      startDate: "2026-09-01",
      endDate: null,
      coordinatorIds: ["coordinator-2"],
      defaultMentorCapacity: undefined,
      meetingFrequencyDays: 14,
      communicationGapDays: undefined,
      bottleneckFlagDays: undefined,
      teams: [{ teamName: "Kavşak", leadEmail: "deniz@kavsak.co" }],
      phases: undefined,
      syllabusDocumentId: null,
    });
  });

  it.each([
    ["an unknown type", { type: "HACKATHON" }],
    ["no type", { type: undefined }],
    ["a coordinator id that is not a string", { coordinatorIds: ["c-2", 7] }],
    ["a rule given as text", { meetingFrequencyDays: "14" }],
    ["a team that is not an object", { teams: ["bad"] }],
  ])("refuses a program with %s instead of guessing", async (_case, change) => {
    const response = await create(
      request("POST", {
        type: "PEER_MENTORING",
        name: "METU BİGG 2026",
        coordinatorIds: [],
        ...change,
      }),
    );

    expect(response.status).toBe(400);
    expect(api.createCoordinatorProgram).not.toHaveBeenCalled();
  });

  it("lists and adds teams", async () => {
    await listTeams(new Request("http://localhost"), teamParams);
    expect(api.fetchProgramTeams).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
    );

    const teams = [{ teamName: "Kavşak", leadEmail: "deniz@kavsak.co" }];
    await addTeams(request("POST", { teams }), teamParams);
    expect(api.addProgramTeams).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      teams,
    );
  });

  it("fixes and removes a waiting team, passing only its name and email", async () => {
    await PUT(
      request("PUT", {
        teamName: "Tohum",
        leadEmail: "can@tohum.io",
        organizationId: "org-9",
      }),
      inviteParams,
    );
    expect(api.updateProgramTeam).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "invite-1",
      { teamName: "Tohum", leadEmail: "can@tohum.io" },
    );

    await DELETE(new Request("http://localhost"), inviteParams);
    expect(api.removeProgramTeam).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "invite-1",
    );
  });

  it("emails a team code and opens a joined team as the signed-in coordinator", async () => {
    await sendCode(
      new Request("http://localhost", { method: "POST" }),
      inviteParams,
    );
    expect(api.sendProgramTeamCode).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "invite-1",
    );

    await teamDetail(new Request("http://localhost"), {
      params: Promise.resolve({ id: "program-1", organizationId: "org-1" }),
    });
    expect(api.fetchProgramTeamDetail).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "org-1",
    );
  });

  it("stops at the session check", async () => {
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue(
      guardRefusal(403),
    );

    const response = await create(request("POST", { name: "X" }));

    expect(response.status).toBe(403);
    expect(api.createCoordinatorProgram).not.toHaveBeenCalled();
  });
});
