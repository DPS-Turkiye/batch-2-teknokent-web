import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/users/route";
import { fetchUsers } from "@/lib/api/accounts";
import { requireAdminSession } from "@/lib/server/require-admin";
import {
  UserAccountStatus,
  UserRole,
  type AppSession,
} from "@/interfaces/session";
import { NextResponse } from "next/server";

vi.mock("@/lib/api/accounts", () => ({
  fetchUsers: vi.fn(),
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

describe("GET /api/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a missing session", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue({
      ok: false,
      response: NextResponse.json(
        { code: "SESSION_REQUIRED" },
        { status: 401 },
      ),
    });

    const response = await GET();

    expect(response.status).toBe(401);
    expect(fetchUsers).not.toHaveBeenCalled();
  });

  it("rejects a non-admin session", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ code: "FORBIDDEN" }, { status: 403 }),
    });

    const response = await GET();

    expect(response.status).toBe(403);
    expect(fetchUsers).not.toHaveBeenCalled();
  });

  it("loads only pending accounts for an admin", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue({
      ok: true,
      session: adminSession(),
    });
    vi.mocked(fetchUsers).mockResolvedValue({
      data: [],
      headers: {},
      status: 200,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(fetchUsers).toHaveBeenCalledWith("admin-1", {
      status: UserAccountStatus.Pending,
    });
  });
});
