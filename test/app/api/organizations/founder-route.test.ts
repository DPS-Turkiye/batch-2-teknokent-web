import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/organizations/[id]/founder/route";
import { UserRole, type AppSession } from "@/interfaces/session";
import {
  changeFounder,
  fetchFounderChangeOptions,
} from "@/lib/api/founder-change";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
import {
  founderChangeOptions,
  founderChangeResult,
} from "@test/fixtures/founder-change";
import {
  backendRefusal,
  backendResponse,
  guardRefusal,
  tokenRequest,
} from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/founder-change", () => ({
  fetchFounderChangeOptions: vi.fn(),
  changeFounder: vi.fn(),
}));

vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorOrAdminSession: vi.fn(),
}));

const TEAM = "9b2d4c61-1f0e-4a1b-8c55-2e7f4a9d3b20";
const MEMBER = "6f1c2a52-3a4e-4a59-9a43-0d3c1b5a7e11";

const coordinator: AppSession = {
  userId: "coordinator-1",
  email: "koordinator@teknokent.demo",
  fullName: "Koordinatör",
  jobTitle: "Koordinatör",
  role: UserRole.Coordinator,
};

function context(id = TEAM) {
  return { params: Promise.resolve({ id }) };
}

function get(token: string | undefined = "id-token", id = TEAM) {
  return GET(
    tokenRequest(`http://localhost/api/organizations/${id}/founder`, {
      method: "GET",
      token,
    }),
    context(id),
  );
}

function post(body: unknown, token: string | undefined = "id-token") {
  return POST(
    tokenRequest(`http://localhost/api/organizations/${TEAM}/founder`, {
      method: "POST",
      token,
      body,
    }),
    context(),
  );
}

describe("/api/organizations/[id]/founder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue({
      ok: true,
      session: coordinator,
    });
  });

  it("reads the founder and candidates with the caller's own token", async () => {
    vi.mocked(fetchFounderChangeOptions).mockResolvedValue(
      backendResponse(founderChangeOptions()),
    );

    const response = await get();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(founderChangeOptions());
    expect(fetchFounderChangeOptions).toHaveBeenCalledWith(TEAM, "id-token");
  });

  it("makes the chosen member the founder with the caller's own token", async () => {
    vi.mocked(changeFounder).mockResolvedValue(
      backendResponse(founderChangeResult()),
    );

    const response = await post({ newFounderId: MEMBER });

    expect(response.status).toBe(200);
    expect(changeFounder).toHaveBeenCalledWith(TEAM, MEMBER, "id-token");
  });

  it("refuses anyone who is neither an admin nor a coordinator", async () => {
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue(
      guardRefusal(403),
    );

    expect((await get()).status).toBe(403);
    expect((await post({ newFounderId: MEMBER })).status).toBe(403);
    expect(fetchFounderChangeOptions).not.toHaveBeenCalled();
    expect(changeFounder).not.toHaveBeenCalled();
  });

  it("asks for a sign-in when the request carries no Firebase token", async () => {
    expect((await get("")).status).toBe(401);
    expect((await post({ newFounderId: MEMBER }, "")).status).toBe(401);
    expect(changeFounder).not.toHaveBeenCalled();
  });

  it("rejects a team id that is not a uuid before calling the backend", async () => {
    expect((await get("id-token", "..")).status).toBe(400);
    expect(fetchFounderChangeOptions).not.toHaveBeenCalled();
  });

  it("rejects a body without a valid new founder, or one that is not JSON", async () => {
    expect((await post({})).status).toBe(400);
    expect((await post({ newFounderId: "member-1" })).status).toBe(400);
    const malformed = await POST(
      new NextRequest(`http://localhost/api/organizations/${TEAM}/founder`, {
        method: "POST",
        headers: { Authorization: "Bearer id-token" },
        body: "{",
      }),
      context(),
    );
    expect(malformed.status).toBe(400);
    expect(changeFounder).not.toHaveBeenCalled();
  });

  it("passes a backend refusal through with its status", async () => {
    vi.mocked(changeFounder).mockResolvedValue(
      backendRefusal(404, { message: "Team not found" }),
    );

    expect((await post({ newFounderId: MEMBER })).status).toBe(404);
  });

  it("answers a translated 502 when the backend cannot be reached", async () => {
    vi.mocked(fetchFounderChangeOptions).mockRejectedValue(
      new Error("ECONNREFUSED"),
    );
    vi.mocked(changeFounder).mockRejectedValue(new Error("ECONNREFUSED"));

    const options = await get();
    const change = await post({ newFounderId: MEMBER });

    expect(options.status).toBe(502);
    expect(await options.json()).toMatchObject({
      message: "Takımın üyeleri yüklenemedi.",
    });
    expect(change.status).toBe(502);
    expect(await change.json()).toMatchObject({
      message: "Kurucu değiştirilemedi.",
    });
  });
});
