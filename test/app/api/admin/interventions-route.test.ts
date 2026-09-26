import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT } from "@/app/api/admin/interventions/[id]/resolve/route";
import { GET, POST } from "@/app/api/admin/interventions/route";
import { type AppSession, UserRole } from "@/interfaces/session";
import {
  fetchAdminInterventions,
  openAdminIntervention,
  resolveAdminIntervention,
} from "@/lib/api/admin-interventions";
import { requireAdminSession } from "@/lib/server/require-admin";

vi.mock("@/lib/api/admin-interventions", () => ({
  fetchAdminInterventions: vi.fn(),
  openAdminIntervention: vi.fn(),
  resolveAdminIntervention: vi.fn(),
}));
vi.mock("@/lib/server/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

const ok = { data: [], headers: {}, status: 200 } as never;

function signIn() {
  vi.mocked(requireAdminSession).mockResolvedValue({
    ok: true,
    session: { userId: "admin-1", role: UserRole.Admin } as AppSession,
  });
}

describe("admin intervention routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists, opens and resolves as the signed-in admin", async () => {
    signIn();
    vi.mocked(fetchAdminInterventions).mockResolvedValue(ok);
    vi.mocked(openAdminIntervention).mockResolvedValue(ok);
    vi.mocked(resolveAdminIntervention).mockResolvedValue(ok);

    await GET();
    expect(fetchAdminInterventions).toHaveBeenCalledWith("admin-1");

    await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          mentorshipId: "m-1",
          action: "Ara",
          note: "Bak",
          actorId: "someone",
        }),
      }),
    );
    expect(openAdminIntervention).toHaveBeenCalledWith("admin-1", {
      mentorshipId: "m-1",
      action: "Ara",
      note: "Bak",
    });

    await PUT(new Request("http://localhost", { method: "PUT" }), {
      params: Promise.resolve({ id: "follow-1" }),
    });
    expect(resolveAdminIntervention).toHaveBeenCalledWith(
      "admin-1",
      "follow-1",
    );
  });

  it("stops anyone who is not an admin", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ code: "FORBIDDEN" }, { status: 403 }),
    });

    expect((await GET()).status).toBe(403);
    expect(fetchAdminInterventions).not.toHaveBeenCalled();
  });
});
