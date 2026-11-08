import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GET as programCategories,
  PUT as replaceCategories,
} from "@/app/api/coordinator/programs/[id]/peer-categories/route";
import { GET as myCategories } from "@/app/api/peer-mentoring/categories/route";
import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { UserRole, type AppSession } from "@/interfaces/session";
import { fetchPeerCategories } from "@/lib/api/peer-mentoring";
import {
  fetchProgramPeerCategories,
  replaceProgramPeerCategories,
} from "@/lib/api/program-peer-categories";
import { getSessionUser } from "@/lib/session";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/api/peer-mentoring", () => ({ fetchPeerCategories: vi.fn() }));
vi.mock("@/lib/api/program-peer-categories", () => ({
  fetchProgramPeerCategories: vi.fn(),
  replaceProgramPeerCategories: vi.fn(),
}));

const ok = { status: 200, data: [], headers: {} };
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

describe("peer category routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const call of [
      fetchPeerCategories,
      fetchProgramPeerCategories,
      replaceProgramPeerCategories,
    ]) {
      vi.mocked(call).mockResolvedValue(ok as never);
    }
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

  it("keeps a program's categories to its coordinators and the admin", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Mentee));
    expect(
      (await programCategories(new Request("http://x"), program)).status,
    ).toBe(403);
    expect(fetchProgramPeerCategories).not.toHaveBeenCalled();

    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Coordinator));
    await programCategories(new Request("http://x"), program);
    expect(fetchProgramPeerCategories).toHaveBeenCalledWith(
      "COORDINATOR-1",
      "p1",
    );
  });

  it("forwards only real category codes when replacing the set", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Coordinator));
    await replaceCategories(
      new Request("http://x", {
        method: "PUT",
        body: JSON.stringify({
          categories: [PeerTopicCategory.CampusLife, "NOT_A_CATEGORY", 7],
        }),
      }),
      program,
    );
    expect(replaceProgramPeerCategories).toHaveBeenCalledWith(
      "COORDINATOR-1",
      "p1",
      [PeerTopicCategory.CampusLife],
    );
  });
});
