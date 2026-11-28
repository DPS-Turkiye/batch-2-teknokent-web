import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GET as programCategories,
  PUT as replaceCategories,
} from "@/app/api/coordinator/programs/[id]/peer-categories/route";
import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { UserRole, type AppSession } from "@/interfaces/session";
import {
  fetchProgramPeerCategories,
  replaceProgramPeerCategories,
} from "@/lib/api/program-peer-categories";
import { getSessionUser } from "@/lib/session";
import { answerEachWith, backendResponse } from "@test/fixtures/route-handlers";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/api/program-peer-categories", () => ({
  fetchProgramPeerCategories: vi.fn(),
  replaceProgramPeerCategories: vi.fn(),
}));

const ok = backendResponse([]);
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
    answerEachWith(
      [fetchProgramPeerCategories, replaceProgramPeerCategories],
      ok,
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

  it("forwards a list of real category codes, an empty one included", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Coordinator));
    const put = (body: unknown) =>
      replaceCategories(
        new Request("http://x", { method: "PUT", body: JSON.stringify(body) }),
        program,
      );

    await put({ categories: [PeerTopicCategory.CampusLife] });
    expect(replaceProgramPeerCategories).toHaveBeenLastCalledWith(
      "COORDINATOR-1",
      "p1",
      [PeerTopicCategory.CampusLife],
    );
    await put({ categories: [] });
    expect(replaceProgramPeerCategories).toHaveBeenLastCalledWith(
      "COORDINATOR-1",
      "p1",
      [],
    );
  });

  it("refuses a body that is not a list of category codes instead of turning everything off", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(as(UserRole.Coordinator));
    for (const body of [
      {},
      { categories: PeerTopicCategory.CampusLife },
      { categories: [PeerTopicCategory.CampusLife, "NOT_A_CATEGORY"] },
      null,
    ]) {
      const response = await replaceCategories(
        new Request("http://x", { method: "PUT", body: JSON.stringify(body) }),
        program,
      );
      expect(response.status).toBe(400);
    }
    expect(replaceProgramPeerCategories).not.toHaveBeenCalled();
  });
});
