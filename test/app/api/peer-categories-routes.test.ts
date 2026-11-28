import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as myCategories } from "@/app/api/peer-mentoring/categories/route";
import { UserRole, type AppSession } from "@/interfaces/session";
import { fetchPeerCategories } from "@/lib/api/peer-mentoring";
import { getSessionUser } from "@/lib/session";
import { answerEachWith, backendResponse } from "@test/fixtures/route-handlers";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/api/peer-mentoring", () => ({ fetchPeerCategories: vi.fn() }));

const ok = backendResponse([]);

function as(role: UserRole): AppSession {
  return {
    userId: `${role}-1`,
    email: "someone@menton.test",
    fullName: "Someone",
    jobTitle: "x",
    role,
  };
}

describe("peer category routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    answerEachWith(
      [
        fetchPeerCategories,
      ],
      ok,
    );
  });

  it("gives a signed-in student their program's categories, or a mentor's with as=MENTOR", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    expect(
      (await myCategories(new NextRequest("http://localhost/x"))).status,
    ).toBe(401);

    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Mentee));
    await myCategories(new NextRequest("http://localhost/x"));
    expect(fetchPeerCategories).toHaveBeenLastCalledWith(
      "MENTEE-1",
      UserRole.Mentee,
    );
    await myCategories(new NextRequest("http://localhost/x?as=MENTOR"));
    expect(fetchPeerCategories).toHaveBeenLastCalledWith(
      "MENTEE-1",
      UserRole.Mentor,
    );
  });

});
