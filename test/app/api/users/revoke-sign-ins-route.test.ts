import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/users/[id]/sign-ins/revoke/route";
import { UserRole, type AppSession } from "@/interfaces/session";
import { revokeSignIns } from "@/lib/api/accounts";
import { requireAdminSession } from "@/lib/server/require-admin";
import {
  backendRefusal,
  backendResponse,
  guardRefusal,
} from "@test/fixtures/route-handlers";
import { backendUser } from "@test/fixtures/session";

vi.mock("@/lib/api/accounts", () => ({
  revokeSignIns: vi.fn(),
}));

vi.mock("@/lib/server/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

const admin: AppSession = {
  userId: "admin-1",
  email: "admin@teknokent.demo",
  fullName: "Demo Administrator",
  jobTitle: "Admin",
  role: UserRole.Admin,
};

function post(body: unknown = {}) {
  return POST(
    new NextRequest("http://localhost/api/users/user-1/sign-ins/revoke", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "user-1" }) },
  );
}

describe("POST /api/users/[id]/sign-ins/revoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminSession).mockResolvedValue({
      ok: true,
      session: admin,
    });
  });

  it("acts as the signed-in admin, not an actor named in the body", async () => {
    vi.mocked(revokeSignIns).mockResolvedValue(
      backendResponse(
        backendUser({ signInsRevokedAt: "2026-10-23T15:00:00Z" }),
      ),
    );

    const response = await post({ actorId: "forged-admin" });

    expect(response.status).toBe(200);
    expect(revokeSignIns).toHaveBeenCalledWith("user-1", "admin-1");
  });

  it("refuses anyone who is not an admin", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue(guardRefusal(403));

    const response = await post();

    expect(response.status).toBe(403);
    expect(revokeSignIns).not.toHaveBeenCalled();
  });

  it("passes a backend failure through with its status", async () => {
    vi.mocked(revokeSignIns).mockResolvedValue(
      backendRefusal(502, { message: "Firebase" }),
    );

    const response = await post();

    expect(response.status).toBe(502);
  });
});
