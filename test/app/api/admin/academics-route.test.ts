import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/admin/academics/route";
import { UserRole, type AppSession } from "@/interfaces/session";
import { fetchAdminAcademics } from "@/lib/api/admin-academics";
import { getSessionUser } from "@/lib/session";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/api/admin-academics", () => ({
  fetchAdminAcademics: vi.fn(),
}));

function as(role: UserRole): AppSession {
  return {
    userId: `${role}-1`,
    email: "someone@menton.test",
    fullName: "Someone",
    jobTitle: "x",
    role,
  };
}

describe("admin academics route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchAdminAcademics).mockResolvedValue({
      status: 200,
      data: [],
      headers: {},
    });
  });

  it("lists academicians for an admin, as that admin", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Admin));
    expect((await GET()).status).toBe(200);
    expect(fetchAdminAcademics).toHaveBeenCalledWith("ADMIN-1");
  });

  it("keeps everyone else out", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Coordinator));
    expect((await GET()).status).toBe(403);
    expect(fetchAdminAcademics).not.toHaveBeenCalled();
  });
});
