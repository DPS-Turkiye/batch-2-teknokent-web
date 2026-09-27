import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as suggestions } from "@/app/api/coordinator/programs/[id]/matching/[organizationId]/suggestions/route";
import { GET, POST } from "@/app/api/coordinator/programs/[id]/matching/route";
import { type AppSession, UserRole } from "@/interfaces/session";
import * as api from "@/lib/api/coordinator-programs";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

vi.mock("@/lib/api/coordinator-programs", () => ({
  fetchMatching: vi.fn(),
  fetchMatchSuggestions: vi.fn(),
  createMatch: vi.fn(),
}));
vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorSession: vi.fn(),
}));

const ok = { data: {}, headers: {}, status: 200 } as never;
const program = { params: Promise.resolve({ id: "program-1" }) };

describe("coordinator matching routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: true,
      session: { userId: "c-1", role: UserRole.Coordinator } as AppSession,
    });
    for (const fn of Object.values(api)) vi.mocked(fn).mockResolvedValue(ok);
  });

  it("reads the queue and suggestions, and matches as the signed-in coordinator", async () => {
    await GET(new Request("http://localhost"), program);
    expect(api.fetchMatching).toHaveBeenCalledWith("c-1", "program-1");

    await suggestions(new Request("http://localhost"), {
      params: Promise.resolve({ id: "program-1", organizationId: "terra" }),
    });
    expect(api.fetchMatchSuggestions).toHaveBeenCalledWith(
      "c-1",
      "program-1",
      "terra",
    );

    await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          organizationId: "terra",
          mentorId: "nihan",
          actorId: "someone-else",
        }),
      }),
      program,
    );
    expect(api.createMatch).toHaveBeenCalledWith("c-1", "program-1", {
      organizationId: "terra",
      mentorId: "nihan",
    });
  });

  it("stops at the session check", async () => {
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ code: "FORBIDDEN" }, { status: 403 }),
    });
    const response = await GET(new Request("http://localhost"), program);
    expect(response.status).toBe(403);
    expect(api.fetchMatching).not.toHaveBeenCalled();
  });
});
