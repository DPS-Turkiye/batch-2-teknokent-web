import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/admin/programs/[id]/[kind]/[targetId]/route";
import { ProgramMemberKind } from "@/interfaces/admin-overview";
import { UserRole } from "@/interfaces/session";
import { assignToProgram } from "@/lib/api/admin-program-members";
import { requireAdminSession } from "@/lib/server/require-admin";
import { guardRefusal } from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/admin-program-members", () => ({
  assignToProgram: vi.fn(),
}));
vi.mock("@/lib/server/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

function call(kind: string) {
  return POST(new Request("http://localhost", { method: "POST" }), {
    params: Promise.resolve({ id: "program-1", kind, targetId: "target-1" }),
  });
}

describe("POST /api/admin/programs/[id]/[kind]/[targetId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assignToProgram).mockResolvedValue({
      data: undefined,
      headers: {},
      status: 204,
    });
  });

  it("assigns as the signed-in admin", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue({
      ok: true,
      session: appSession({ userId: "admin-1", role: UserRole.Admin }),
    });

    await call(ProgramMemberKind.Startups);

    expect(assignToProgram).toHaveBeenCalledWith(
      "admin-1",
      "program-1",
      ProgramMemberKind.Startups,
      "target-1",
    );
  });

  it("refuses an unknown kind", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue({
      ok: true,
      session: appSession({ userId: "admin-1", role: UserRole.Admin }),
    });

    expect((await call("coordinators")).status).toBe(404);
    expect(assignToProgram).not.toHaveBeenCalled();
  });

  it("stops anyone who is not an admin", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue(guardRefusal(403));

    expect((await call(ProgramMemberKind.Mentors)).status).toBe(403);
    expect(assignToProgram).not.toHaveBeenCalled();
  });
});
