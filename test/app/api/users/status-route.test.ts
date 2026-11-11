import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PATCH } from "@/app/api/users/[id]/status/route";
import {
  UserAccountStatus,
  UserRole,
  type AppSession,
} from "@/interfaces/session";
import { decideAccountStatus } from "@/lib/api/accounts";
import { requireAdminSession } from "@/lib/server/require-admin";
import { guardRefusal } from "@test/fixtures/route-handlers";
import { backendUser } from "@test/fixtures/session";

vi.mock("@/lib/api/accounts", () => ({
  decideAccountStatus: vi.fn(),
}));

vi.mock("@/lib/server/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

function adminSession(): AppSession {
  return {
    userId: "admin-1",
    email: "admin@teknokent.demo",
    fullName: "Demo Administrator",
    jobTitle: "Koordinatör",
    role: UserRole.Admin,
  };
}

function patch(status: string, id = "user-1") {
  return PATCH(
    new NextRequest("http://localhost/api/users/user-1/status", {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
    { params: Promise.resolve({ id }) },
  );
}

describe("PATCH /api/users/[id]/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminSession).mockResolvedValue({
      ok: true,
      session: adminSession(),
    });
  });

  it("takes actorId from the session cookie, not the request body", async () => {
    vi.mocked(decideAccountStatus).mockResolvedValue({
      data: { user: backendUser(), inviteCode: "ABCD2345" },
      headers: {},
      status: 200,
    });

    const response = await PATCH(
      new NextRequest("http://localhost/api/users/user-1/status", {
        method: "PATCH",
        body: JSON.stringify({
          status: UserAccountStatus.Approved,
          actorId: "forged-admin",
        }),
      }),
      { params: Promise.resolve({ id: "user-1" }) },
    );

    expect(response.status).toBe(200);
    expect(decideAccountStatus).toHaveBeenCalledWith(
      "user-1",
      "admin-1",
      UserAccountStatus.Approved,
    );
  });

  it("rejects a status other than APPROVED or REJECTED", async () => {
    const response = await patch("PENDING");

    expect(response.status).toBe(400);
    expect(decideAccountStatus).not.toHaveBeenCalled();
  });

  it("does not call Spring when the caller is not an admin", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue(guardRefusal(403));

    const response = await patch(UserAccountStatus.Approved);

    expect(response.status).toBe(403);
    expect(decideAccountStatus).not.toHaveBeenCalled();
  });
});
