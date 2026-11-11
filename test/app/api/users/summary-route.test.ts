import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/users/[id]/summary/route";
import { UserRole } from "@/interfaces/session";
import { fetchPersonSummary } from "@/lib/api/person-summary";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
import { mentorSummary } from "@test/fixtures/person-summary";
import {
  backendRefusal,
  backendResponse,
  guardRefusal,
} from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/person-summary", () => ({ fetchPersonSummary: vi.fn() }));

vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorOrAdminSession: vi.fn(),
}));

const USER_ID = "00000000-0000-0000-0000-000000000803";

const coordinator = appSession({
  userId: "coordinator-1",
  role: UserRole.Coordinator,
});

function get(id = USER_ID) {
  return GET(
    new NextRequest(`http://localhost/api/users/${id}/summary?actorId=forged`),
    { params: Promise.resolve({ id }) },
  );
}

describe("GET /api/users/[id]/summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue({
      ok: true,
      session: coordinator,
    });
  });

  it("asks the backend as the signed-in coordinator, never a named actor", async () => {
    vi.mocked(fetchPersonSummary).mockResolvedValue(
      backendResponse(mentorSummary({ id: USER_ID })),
    );

    const response = await get();

    expect(response.status).toBe(200);
    expect(fetchPersonSummary).toHaveBeenCalledWith(USER_ID, "coordinator-1");
    expect(await response.json()).toEqual(mentorSummary({ id: USER_ID }));
  });

  it("refuses anyone who is not a coordinator or admin", async () => {
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue(
      guardRefusal(403),
    );

    const response = await get();

    expect(response.status).toBe(403);
    expect(fetchPersonSummary).not.toHaveBeenCalled();
  });

  it("passes the backend's not-found through", async () => {
    vi.mocked(fetchPersonSummary).mockResolvedValue(
      backendRefusal(404, { message: "User not found" }),
    );

    const response = await get();

    expect(response.status).toBe(404);
  });

  it("answers 400 for an id that is not a uuid, without calling the backend", async () => {
    const response = await get("..");

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "INVALID_REQUEST" });
    expect(fetchPersonSummary).not.toHaveBeenCalled();
  });
});
