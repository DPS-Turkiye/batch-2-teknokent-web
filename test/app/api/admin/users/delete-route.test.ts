import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/admin/users/[id]/delete/route";
import { UserRole, type AppSession } from "@/interfaces/session";
import { deleteUser } from "@/lib/api/accounts";
import { requireAdminSession } from "@/lib/server/require-admin";
import {
  backendRefusal,
  backendResponse,
  guardRefusal,
  tokenRequest,
} from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/accounts", () => ({
  deleteUser: vi.fn(),
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

function post(body: unknown, token: string | undefined = "id-token") {
  return POST(
    tokenRequest("http://localhost/api/admin/users/user-1/delete", {
      method: "POST",
      token,
      body,
    }),
    { params: Promise.resolve({ id: "user-1" }) },
  );
}

describe("POST /api/admin/users/[id]/delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminSession).mockResolvedValue({
      ok: true,
      session: admin,
    });
  });

  it("forwards the typed address with the admin's own token", async () => {
    vi.mocked(deleteUser).mockResolvedValue(
      backendResponse({ deletedUserId: "user-1", cleanupPending: false }),
    );

    const response = await post({ confirmEmail: " ayse@example.com " });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      deletedUserId: "user-1",
      cleanupPending: false,
    });
    expect(deleteUser).toHaveBeenCalledWith(
      "user-1",
      "ayse@example.com",
      "id-token",
    );
  });

  it("refuses anyone who is not an admin", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue(guardRefusal(403));

    const response = await post({ confirmEmail: "ayse@example.com" });

    expect(response.status).toBe(403);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("asks for a sign-in when the request carries no Firebase token", async () => {
    const response = await post({ confirmEmail: "ayse@example.com" }, "");

    expect(response.status).toBe(401);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("rejects a missing confirmation address", async () => {
    const response = await post({ confirmEmail: "  " });

    expect(response.status).toBe(400);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("passes a backend refusal through with its status", async () => {
    vi.mocked(deleteUser).mockResolvedValue(
      backendRefusal(409, { message: "E-posta eşleşmiyor." }),
    );

    const response = await post({ confirmEmail: "wrong@example.com" });

    expect(response.status).toBe(409);
  });
});
