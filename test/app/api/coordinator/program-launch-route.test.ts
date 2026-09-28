import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DELETE,
  PUT,
} from "@/app/api/coordinator/programs/[id]/teams/[inviteId]/route";
import {
  GET as listTeams,
  POST as addTeams,
} from "@/app/api/coordinator/programs/[id]/teams/route";
import { GET as teamDetail } from "@/app/api/coordinator/programs/[id]/team-details/[organizationId]/route";
import { POST as sendCode } from "@/app/api/coordinator/programs/[id]/teams/[inviteId]/send-code/route";
import { POST as create } from "@/app/api/coordinator/programs/route";
import { type AppSession, UserRole } from "@/interfaces/session";
import * as api from "@/lib/api/coordinator-programs";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

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
  requireCoordinatorSession: vi.fn(),
}));

const ok = { data: [], headers: {}, status: 200 } as never;
const teamParams = { params: Promise.resolve({ id: "program-1" }) };
const inviteParams = {
  params: Promise.resolve({ id: "program-1", inviteId: "invite-1" }),
};
const request = (method: string, value: unknown) =>
  new Request("http://localhost", { method, body: JSON.stringify(value) });

describe("coordinator program launch routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: true,
      session: {
        userId: "coordinator-1",
        role: UserRole.Coordinator,
      } as AppSession,
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
      vi.mocked(fn).mockResolvedValue(ok);
    }
  });

  it("creates a program as the signed-in coordinator", async () => {
    const input = { name: "METU BİGG 2026", teams: [] };
    const response = await create(request("POST", input));

    expect(response.status).toBe(200);
    expect(api.createCoordinatorProgram).toHaveBeenCalledWith(
      "coordinator-1",
      input,
    );
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
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ code: "FORBIDDEN" }, { status: 403 }),
    });

    const response = await create(request("POST", { name: "X" }));

    expect(response.status).toBe(403);
    expect(api.createCoordinatorProgram).not.toHaveBeenCalled();
  });
});
