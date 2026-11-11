import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/users/[id]/summary/route";
import { UserRole, type AppSession } from "@/interfaces/session";
import { fetchPersonSummary } from "@/lib/api/person-summary";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

vi.mock("@/lib/api/person-summary", () => ({ fetchPersonSummary: vi.fn() }));

vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorSession: vi.fn(),
}));

const coordinator: AppSession = {
  userId: "coordinator-1",
  email: "coordinator@example.test",
  fullName: "Örnek Koordinatör",
  jobTitle: "Koordinatör",
  role: UserRole.Coordinator,
};

const USER_ID = "00000000-0000-0000-0000-000000000803";

function get(id = USER_ID) {
  return GET(
    new NextRequest(`http://localhost/api/users/${id}/summary?actorId=forged`),
    {
      params: Promise.resolve({ id }),
    },
  );
}

describe("GET /api/users/[id]/summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: true,
      session: coordinator,
    });
  });

  it("asks the backend as the signed-in coordinator, never a named actor", async () => {
    vi.mocked(fetchPersonSummary).mockResolvedValue({
      data: { id: USER_ID, fullName: "Deniz Yıldız" },
      headers: {},
      status: 200,
    });

    const response = await get();

    expect(response.status).toBe(200);
    expect(fetchPersonSummary).toHaveBeenCalledWith(USER_ID, "coordinator-1");
    expect(await response.json()).toMatchObject({ fullName: "Deniz Yıldız" });
  });

  it("refuses anyone who is not a coordinator or admin", async () => {
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ code: "FORBIDDEN" }, { status: 403 }),
    });

    const response = await get();

    expect(response.status).toBe(403);
    expect(fetchPersonSummary).not.toHaveBeenCalled();
  });

  it("passes the backend's not-found through", async () => {
    vi.mocked(fetchPersonSummary).mockResolvedValue({
      data: { message: "User not found" },
      headers: {},
      status: 404,
    });

    const response = await get();

    expect(response.status).toBe(404);
  });

  it("answers 404 for an id that is not a uuid, without calling the backend", async () => {
    const response = await get("..");

    expect(response.status).toBe(404);
    expect(fetchPersonSummary).not.toHaveBeenCalled();
  });
});
