import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as requestRemovalRoute } from "@/app/api/organization-members/[memberId]/removal-request/route";
import { POST as cancelRoute } from "@/app/api/team-changes/[requestId]/cancel/route";
import { POST as leaveRoute } from "@/app/api/team-changes/leave/route";
import { POST as leaveRequestRoute } from "@/app/api/team-changes/leave-request/route";
import { GET as listRoute } from "@/app/api/team-changes/route";
import { GET as historyRoute } from "@/app/api/users/[id]/team-history/route";
import { UserRole } from "@/interfaces/session";
import {
  cancelTeamChange,
  fetchTeamChanges,
  fetchTeamHistory,
  leaveTeam,
  requestLeave,
  requestRemoval,
} from "@/lib/api/team-changes";
import {
  getSessionIds,
  getSessionUser,
  refreshSessionUser,
} from "@/lib/session";

vi.mock("@/lib/api/team-changes", () => ({
  cancelTeamChange: vi.fn(),
  fetchTeamChanges: vi.fn(),
  fetchTeamHistory: vi.fn(),
  leaveTeam: vi.fn(),
  requestLeave: vi.fn(),
  requestRemoval: vi.fn(),
}));
vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
  getSessionUser: vi.fn(),
  refreshSessionUser: vi.fn(),
}));

const ok = (data: unknown, status = 200) =>
  ({ status, data, headers: {} }) as never;

describe("team change routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "cto",
      organizationId: "org-1",
    });
  });

  it("acts as the session user on the session's startup", async () => {
    vi.mocked(fetchTeamChanges).mockResolvedValue(ok([]));
    vi.mocked(requestLeave).mockResolvedValue(ok({ id: "tc-1" }, 201));
    vi.mocked(requestRemoval).mockResolvedValue(ok({ id: "tc-2" }, 201));
    vi.mocked(cancelTeamChange).mockResolvedValue(ok({ id: "tc-1" }));

    expect((await listRoute()).status).toBe(200);
    expect((await leaveRequestRoute()).status).toBe(201);
    await requestRemovalRoute(
      new NextRequest("http://localhost/x", { method: "POST" }),
      { params: Promise.resolve({ memberId: "designer" }) },
    );
    await cancelRoute(
      new NextRequest("http://localhost/x", { method: "POST" }),
      {
        params: Promise.resolve({ requestId: "tc-1" }),
      },
    );

    expect(fetchTeamChanges).toHaveBeenCalledWith("org-1", "cto");
    expect(requestLeave).toHaveBeenCalledWith("org-1", "cto");
    expect(requestRemoval).toHaveBeenCalledWith("org-1", "designer", "cto");
    expect(cancelTeamChange).toHaveBeenCalledWith("org-1", "tc-1", "cto");
  });

  it("answers the leader's leave with the refreshed session", async () => {
    vi.mocked(leaveTeam).mockResolvedValue(ok({ id: "cto" }));
    vi.mocked(refreshSessionUser).mockResolvedValue({ userId: "cto" } as never);

    const response = await leaveRoute(
      new Request("http://localhost/x", {
        method: "POST",
        body: JSON.stringify({ successorId: "designer" }),
      }),
    );

    expect(leaveTeam).toHaveBeenCalledWith("org-1", "cto", "designer");
    expect(refreshSessionUser).toHaveBeenCalledWith({ id: "cto" });
    expect(await response.json()).toEqual({ userId: "cto" });
  });

  it("keeps the session when the backend refuses the leave", async () => {
    vi.mocked(leaveTeam).mockResolvedValue(ok({ message: "no" }, 400));

    const response = await leaveRoute(
      new Request("http://localhost/x", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(leaveTeam).toHaveBeenCalledWith("org-1", "cto", null);
    expect(response.status).toBe(400);
    expect(refreshSessionUser).not.toHaveBeenCalled();
  });

  it("shows team history only to coordinators and admins", async () => {
    const context = { params: Promise.resolve({ id: "cto" }) };
    const request = new NextRequest("http://localhost/x");
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: "m1",
      role: UserRole.Mentee,
    } as never);
    expect((await historyRoute(request, context)).status).toBe(403);
    expect(fetchTeamHistory).not.toHaveBeenCalled();

    vi.mocked(getSessionUser).mockResolvedValue({
      userId: "coor",
      role: UserRole.Coordinator,
    } as never);
    vi.mocked(fetchTeamHistory).mockResolvedValue(ok({ stays: [] }));
    expect((await historyRoute(request, context)).status).toBe(200);
    expect(fetchTeamHistory).toHaveBeenCalledWith("cto", "coor");
  });
});
