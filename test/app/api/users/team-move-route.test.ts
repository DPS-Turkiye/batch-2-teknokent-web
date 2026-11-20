import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/users/[id]/team-move/route";
import { UserRole, type AppSession } from "@/interfaces/session";
import { fetchTeamMoveOptions, moveMemberToTeam } from "@/lib/api/team-moves";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
import {
  backendRefusal,
  backendResponse,
  guardRefusal,
  tokenRequest,
} from "@test/fixtures/route-handlers";
import { teamMoveOptions, teamMoveResult } from "@test/fixtures/team-moves";

vi.mock("@/lib/api/team-moves", () => ({
  fetchTeamMoveOptions: vi.fn(),
  moveMemberToTeam: vi.fn(),
}));

vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorOrAdminSession: vi.fn(),
}));

const PERSON = "6f1c2a52-3a4e-4a59-9a43-0d3c1b5a7e11";
const TEAM = "9b2d4c61-1f0e-4a1b-8c55-2e7f4a9d3b20";

const coordinator: AppSession = {
  userId: "coordinator-1",
  email: "koordinator@teknokent.demo",
  fullName: "Koordinatör",
  jobTitle: "Koordinatör",
  role: UserRole.Coordinator,
};

function context(id = PERSON) {
  return { params: Promise.resolve({ id }) };
}

function get(token: string | undefined = "id-token", id = PERSON) {
  return GET(
    tokenRequest(`http://localhost/api/users/${id}/team-move`, {
      method: "GET",
      token,
    }),
    context(id),
  );
}

function post(body: unknown, token: string | undefined = "id-token") {
  return POST(
    tokenRequest(`http://localhost/api/users/${PERSON}/team-move`, {
      method: "POST",
      token,
      body,
    }),
    context(),
  );
}

describe("/api/users/[id]/team-move", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue({
      ok: true,
      session: coordinator,
    });
  });

  it("reads the options with the caller's own token", async () => {
    vi.mocked(fetchTeamMoveOptions).mockResolvedValue(
      backendResponse(teamMoveOptions()),
    );

    const response = await get();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(teamMoveOptions());
    expect(fetchTeamMoveOptions).toHaveBeenCalledWith(PERSON, "id-token");
  });

  it("moves the person to the chosen team with the caller's own token", async () => {
    vi.mocked(moveMemberToTeam).mockResolvedValue(
      backendResponse(teamMoveResult()),
    );

    const response = await post({ targetOrganizationId: TEAM });

    expect(response.status).toBe(200);
    expect(moveMemberToTeam).toHaveBeenCalledWith(PERSON, TEAM, "id-token");
  });

  it("refuses anyone who is neither an admin nor a coordinator", async () => {
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue(
      guardRefusal(403),
    );

    expect((await get()).status).toBe(403);
    expect((await post({ targetOrganizationId: TEAM })).status).toBe(403);
    expect(fetchTeamMoveOptions).not.toHaveBeenCalled();
    expect(moveMemberToTeam).not.toHaveBeenCalled();
  });

  it("asks for a sign-in when the request carries no Firebase token", async () => {
    expect((await get("")).status).toBe(401);
    expect((await post({ targetOrganizationId: TEAM }, "")).status).toBe(401);
    expect(fetchTeamMoveOptions).not.toHaveBeenCalled();
    expect(moveMemberToTeam).not.toHaveBeenCalled();
  });

  it("rejects a person id that is not a uuid before calling the backend", async () => {
    expect((await get("id-token", "..")).status).toBe(400);
    expect(fetchTeamMoveOptions).not.toHaveBeenCalled();
  });

  it("rejects a body without a valid target team", async () => {
    expect((await post({})).status).toBe(400);
    expect((await post({ targetOrganizationId: "org-2" })).status).toBe(400);
    expect(moveMemberToTeam).not.toHaveBeenCalled();
  });

  it("passes the backend's founder refusal through with its status and code", async () => {
    vi.mocked(moveMemberToTeam).mockResolvedValue(
      backendRefusal(409, {
        code: "TEAM_FOUNDER",
        message: "Takımın kurucusu taşınamaz.",
      }),
    );

    const response = await post({ targetOrganizationId: TEAM });

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "TEAM_FOUNDER" });
  });

  it("rejects a body that is not JSON", async () => {
    const response = await POST(
      new NextRequest(`http://localhost/api/users/${PERSON}/team-move`, {
        method: "POST",
        headers: { Authorization: "Bearer id-token" },
        body: "{",
      }),
      context(),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "INVALID_REQUEST" });
    expect(moveMemberToTeam).not.toHaveBeenCalled();
  });

  it("answers a translated 502 when the backend cannot be reached", async () => {
    vi.mocked(fetchTeamMoveOptions).mockRejectedValue(
      new Error("ECONNREFUSED"),
    );
    vi.mocked(moveMemberToTeam).mockRejectedValue(new Error("ECONNREFUSED"));

    const options = await get();
    const move = await post({ targetOrganizationId: TEAM });

    expect(options.status).toBe(502);
    expect(await options.json()).toMatchObject({
      message: "Taşıma seçenekleri yüklenemedi.",
    });
    expect(move.status).toBe(502);
    expect(await move.json()).toMatchObject({ message: "Kişi taşınamadı." });
  });
});
