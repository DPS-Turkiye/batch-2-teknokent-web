import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT } from "@/app/api/admin/interventions/[id]/resolve/route";
import { GET, POST } from "@/app/api/admin/interventions/route";
import { UserRole } from "@/interfaces/session";
import {
  fetchAdminInterventions,
  openAdminIntervention,
  resolveAdminIntervention,
} from "@/lib/api/admin-interventions";
import { requireAdminSession } from "@/lib/server/require-admin";
import {
  answerEachWith,
  backendResponse,
  guardRefusal,
} from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/admin-interventions", () => ({
  fetchAdminInterventions: vi.fn(),
  openAdminIntervention: vi.fn(),
  resolveAdminIntervention: vi.fn(),
}));
vi.mock("@/lib/server/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

const ok = backendResponse([]);

function signIn() {
  vi.mocked(requireAdminSession).mockResolvedValue({
    ok: true,
    session: appSession({ userId: "admin-1", role: UserRole.Admin }),
  });
}

describe("admin intervention routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists, opens and resolves as the signed-in admin", async () => {
    signIn();
    answerEachWith(
      [
        fetchAdminInterventions,
        openAdminIntervention,
        resolveAdminIntervention,
      ],
      ok,
    );

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
    vi.mocked(requireAdminSession).mockResolvedValue(guardRefusal(403));

    expect((await GET()).status).toBe(403);
    expect(fetchAdminInterventions).not.toHaveBeenCalled();
  });
});
