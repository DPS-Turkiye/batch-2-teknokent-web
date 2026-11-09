import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as adminStudents } from "@/app/api/admin/students/route";
import { POST as revoke } from "@/app/api/coordinator/programs/[id]/badges/awards/[awardId]/revoke/route";
import { POST as award } from "@/app/api/coordinator/programs/[id]/badges/awards/route";
import { GET as roster } from "@/app/api/coordinator/programs/[id]/badges/roster/route";
import { GET as myAchievements } from "@/app/api/me/badges/achievements/route";
import { GET as myBadges } from "@/app/api/me/badges/route";
import { GET as userBadges } from "@/app/api/users/[id]/badges/route";
import { GateBadgeState } from "@/interfaces/badges";
import { UserRole, type AppSession } from "@/interfaces/session";
import {
  awardGateBadge,
  fetchAdminStudents,
  fetchMyAchievements,
  fetchMyBadges,
  fetchProgramBadgeRoster,
  fetchUserBadges,
  revokeGateBadge,
} from "@/lib/api/badges";
import { getSessionUser } from "@/lib/session";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/api/badges", () => ({
  awardGateBadge: vi.fn(),
  fetchAdminStudents: vi.fn(),
  fetchMyAchievements: vi.fn(),
  fetchMyBadges: vi.fn(),
  fetchProgramBadgeRoster: vi.fn(),
  fetchUserBadges: vi.fn(),
  revokeGateBadge: vi.fn(),
}));

const ok = { status: 200, data: [], headers: {} };

function as(role: UserRole): AppSession {
  return {
    userId: `${role}-1`,
    email: "someone@menton.test",
    fullName: "Someone",
    jobTitle: "x",
    role,
  };
}

const program = { params: Promise.resolve({ id: "p1" }) };

function post(url: string, body: unknown) {
  return new NextRequest(url, { method: "POST", body: JSON.stringify(body) });
}

describe("badge routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const call of [
      awardGateBadge,
      fetchAdminStudents,
      fetchMyAchievements,
      fetchMyBadges,
      fetchProgramBadgeRoster,
      fetchUserBadges,
      revokeGateBadge,
    ]) {
      vi.mocked(call).mockResolvedValue(ok as never);
    }
  });

  it("asks for the signed-in person's own badges and a session for anyone else's", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    expect((await myBadges()).status).toBe(401);
    expect(
      (
        await userBadges(new NextRequest("http://localhost/x"), {
          params: Promise.resolve({ id: "u9" }),
        })
      ).status,
    ).toBe(401);

    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Mentee));
    await myBadges();
    expect(fetchMyBadges).toHaveBeenCalledWith("MENTEE-1");
    await userBadges(new NextRequest("http://localhost/x"), {
      params: Promise.resolve({ id: "u9" }),
    });
    expect(fetchUserBadges).toHaveBeenCalledWith("u9");
  });

  it("asks for the signed-in person's own achievement progress and nobody else's", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    expect((await myAchievements()).status).toBe(401);
    expect(fetchMyAchievements).not.toHaveBeenCalled();

    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Mentee));
    expect((await myAchievements()).status).toBe(200);
    expect(fetchMyAchievements).toHaveBeenCalledWith("MENTEE-1");
  });

  it("keeps the roster, awards and revokes to coordinators and admins, as themselves", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Mentee));
    expect(
      (
        await roster(
          new NextRequest("http://localhost/x?state=ACTIVE"),
          program,
        )
      ).status,
    ).toBe(403);
    expect(fetchProgramBadgeRoster).not.toHaveBeenCalled();

    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Coordinator));
    await roster(new NextRequest("http://localhost/x?state=ACTIVE"), program);
    expect(fetchProgramBadgeRoster).toHaveBeenCalledWith(
      "COORDINATOR-1",
      "p1",
      GateBadgeState.Active,
    );
    await roster(new NextRequest("http://localhost/x?state=BOGUS"), program);
    expect(fetchProgramBadgeRoster).toHaveBeenLastCalledWith(
      "COORDINATOR-1",
      "p1",
      null,
    );

    await award(
      post("http://localhost/x", { userId: "u1", actorId: "someone-else" }),
      program,
    );
    expect(awardGateBadge).toHaveBeenCalledWith("COORDINATOR-1", "p1", "u1");
  });

  it("refuses an award without a person and a revoke without a reason before the backend", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Coordinator));
    expect((await award(post("http://localhost/x", {}), program)).status).toBe(
      400,
    );
    expect(awardGateBadge).not.toHaveBeenCalled();

    const awardRoute = { params: Promise.resolve({ id: "p1", awardId: "a1" }) };
    expect(
      (await revoke(post("http://localhost/x", { reason: "   " }), awardRoute))
        .status,
    ).toBe(400);
    expect(revokeGateBadge).not.toHaveBeenCalled();

    await revoke(
      post("http://localhost/x", { reason: " Görüşmelere gelmedi " }),
      awardRoute,
    );
    expect(revokeGateBadge).toHaveBeenCalledWith(
      "COORDINATOR-1",
      "p1",
      "a1",
      "Görüşmelere gelmedi",
    );
  });

  it("shows the student list to admins only", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Coordinator));
    expect(
      (await adminStudents(new NextRequest("http://localhost/x"))).status,
    ).toBe(403);

    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Admin));
    await adminStudents(new NextRequest("http://localhost/x?state=NONE"));
    expect(fetchAdminStudents).toHaveBeenCalledWith(
      "ADMIN-1",
      GateBadgeState.None,
    );
  });
});
