import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GET as list,
  POST as add,
} from "@/app/api/coordinator/mentorships/[id]/notes/route";
import { DELETE as remove } from "@/app/api/coordinator/notes/[id]/route";
import { type AppSession, UserRole } from "@/interfaces/session";
import {
  addCoordinatorNote,
  deleteCoordinatorNote,
  fetchCoordinatorNotes,
} from "@/lib/api/coordinator-notes";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

vi.mock("@/lib/api/coordinator-notes", () => ({
  addCoordinatorNote: vi.fn(),
  deleteCoordinatorNote: vi.fn(),
  fetchCoordinatorNotes: vi.fn(),
}));
vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorSession: vi.fn(),
}));

const ok = { data: {}, headers: {}, status: 200 } as never;
const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("coordinator note routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: true,
      session: {
        userId: "coordinator-1",
        role: UserRole.Coordinator,
      } as AppSession,
    });
    vi.mocked(fetchCoordinatorNotes).mockResolvedValue(ok);
    vi.mocked(addCoordinatorNote).mockResolvedValue(ok);
    vi.mocked(deleteCoordinatorNote).mockResolvedValue(ok);
  });

  it("lists, adds and deletes as the signed-in coordinator", async () => {
    await list(new Request("http://localhost"), params("m-1"));
    await add(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ body: "Nakit akışı riskli", actorId: "x" }),
      }),
      params("m-1"),
    );
    await remove(new Request("http://localhost"), params("n-1"));

    expect(fetchCoordinatorNotes).toHaveBeenCalledWith("coordinator-1", "m-1");
    expect(addCoordinatorNote).toHaveBeenCalledWith(
      "coordinator-1",
      "m-1",
      "Nakit akışı riskli",
    );
    expect(deleteCoordinatorNote).toHaveBeenCalledWith("coordinator-1", "n-1");
  });

  it("stops at the session check", async () => {
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ code: "FORBIDDEN" }, { status: 403 }),
    });

    const response = await list(new Request("http://localhost"), params("m-1"));

    expect(response.status).toBe(403);
    expect(fetchCoordinatorNotes).not.toHaveBeenCalled();
  });
});
