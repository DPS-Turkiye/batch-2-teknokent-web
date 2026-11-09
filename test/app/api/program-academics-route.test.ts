import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/coordinator/programs/[id]/academics/route";
import { UserRole, type AppSession } from "@/interfaces/session";
import { fetchProgramAcademics } from "@/lib/api/admin-academics";
import { getSessionUser } from "@/lib/session";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/api/admin-academics", () => ({
  fetchProgramAcademics: vi.fn(),
}));

const program = { params: Promise.resolve({ id: "p1" }) };

function as(role: UserRole): AppSession {
  return {
    userId: `${role}-1`,
    email: "someone@menton.test",
    fullName: "Someone",
    jobTitle: "x",
    role,
  };
}

describe("program academics route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchProgramAcademics).mockResolvedValue({
      status: 200,
      data: [],
      headers: {},
    } as never);
  });

  it("lists a program's academicians for its coordinator, as that coordinator", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Coordinator));
    expect((await GET(new Request("http://x"), program)).status).toBe(200);
    expect(fetchProgramAcademics).toHaveBeenCalledWith("COORDINATOR-1", "p1");
  });

  it("keeps students and signed-out visitors out", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    expect((await GET(new Request("http://x"), program)).status).toBe(401);
    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Mentee));
    expect((await GET(new Request("http://x"), program)).status).toBe(403);
    expect(fetchProgramAcademics).not.toHaveBeenCalled();
  });
});
