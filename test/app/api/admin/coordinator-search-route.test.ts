import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/admin/coordinators/search/route";
import { UserRole } from "@/interfaces/session";
import { searchCoordinators } from "@/lib/api/admin-coordinators";
import { requireAdminSession } from "@/lib/server/require-admin";
import tr from "@/messages/tr.json";
import { backendResponse, guardRefusal } from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/admin-coordinators", () => ({
  searchCoordinators: vi.fn(),
}));
vi.mock("@/lib/server/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

const PROGRAM_ID = "6f1c0f9e-6d1b-4a39-9a40-3f0c1d7e2b11";

function search(query: string) {
  return GET(
    new NextRequest(`http://localhost/api/admin/coordinators/search?${query}`),
  );
}

function signIn() {
  vi.mocked(requireAdminSession).mockResolvedValue({
    ok: true,
    session: appSession({ userId: "admin-1", role: UserRole.Admin }),
  });
}

describe("GET /api/admin/coordinators/search", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stops anyone who is not an admin before searching", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue(guardRefusal(403));

    const response = await search("q=ayse");

    expect(response.status).toBe(403);
    expect(searchCoordinators).not.toHaveBeenCalled();
  });

  it("searches as the signed-in admin, whatever actor the browser sends", async () => {
    signIn();
    const found = [{ id: "c-1", fullName: "Ayşe", email: "ayse@x.org" }];
    vi.mocked(searchCoordinators).mockResolvedValue(backendResponse(found));

    const response = await search(
      `q=%20ays%20&programId=${PROGRAM_ID}&actorId=someone-else`,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(found);
    expect(searchCoordinators).toHaveBeenCalledWith("admin-1", {
      q: "ays",
      programId: PROGRAM_ID,
    });
  });

  it.each([
    ["no query", ""],
    ["fewer than three characters", "q=ay"],
    ["only spaces", "q=%20%20%20%20"],
    ["a query longer than an e-mail can be", `q=${"a".repeat(256)}`],
    ["a program id that is not an id", "q=ayse&programId=1%20or%201"],
  ])("refuses %s without asking the backend", async (_case, query) => {
    signIn();

    const response = await search(query);

    expect(response.status).toBe(400);
    expect(searchCoordinators).not.toHaveBeenCalled();
  });

  it("answers a failed backend call with its own message", async () => {
    signIn();
    vi.mocked(searchCoordinators).mockRejectedValue(new Error("down"));

    const response = await search("q=ayse");

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({
      message: tr.apiErrors.coordinatorSearchFailed,
    });
  });
});
