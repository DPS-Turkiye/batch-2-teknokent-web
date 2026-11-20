import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/coordinator/programs/[id]/team-people/route";
import { UserRole } from "@/interfaces/session";
import { fetchProgramTeamPeople } from "@/lib/api/coordinator-programs";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
import { backendResponse, guardRefusal } from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/coordinator-programs", () => ({
  fetchProgramTeamPeople: vi.fn(),
}));
vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorOrAdminSession: vi.fn(),
}));

const params = { params: Promise.resolve({ id: "program-1" }) };
const search = (query: string) => new NextRequest(`http://localhost/x${query}`);

describe("coordinator team people route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue({
      ok: true,
      session: appSession({
        userId: "coordinator-1",
        role: UserRole.Coordinator,
      }),
    });
    vi.mocked(fetchProgramTeamPeople).mockResolvedValue(
      backendResponse({ people: [], truncated: false }),
    );
  });

  it("searches as the signed-in coordinator with the typed name", async () => {
    const response = await GET(search("?q=%C3%A7a%C4%9Fr%C4%B1"), params);

    expect(response.status).toBe(200);
    expect(fetchProgramTeamPeople).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "çağrı",
    );
  });

  it("passes a missing search on as empty for the backend to refuse", async () => {
    await GET(search(""), params);

    expect(fetchProgramTeamPeople).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "",
    );
  });

  it("stops at the session check", async () => {
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue(
      guardRefusal(403),
    );

    const response = await GET(search("?q=cagri"), params);

    expect(response.status).toBe(403);
    expect(fetchProgramTeamPeople).not.toHaveBeenCalled();
  });
});
