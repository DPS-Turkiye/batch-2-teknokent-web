import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  POST as add,
  GET as list,
} from "@/app/api/coordinator/mentorships/[id]/notes/route";
import { DELETE as remove } from "@/app/api/coordinator/notes/[id]/route";
import { UserRole } from "@/interfaces/session";
import {
  addCoordinatorNote,
  deleteCoordinatorNote,
  fetchCoordinatorNotes,
} from "@/lib/api/coordinator-notes";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
import {
  answerEachWith,
  backendResponse,
  guardRefusal,
} from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/coordinator-notes", () => ({
  addCoordinatorNote: vi.fn(),
  deleteCoordinatorNote: vi.fn(),
  fetchCoordinatorNotes: vi.fn(),
}));
vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorOrAdminSession: vi.fn(),
}));

const ok = backendResponse({});
const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("coordinator note routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue({
      ok: true,
      session: appSession({
        userId: "coordinator-1",
        role: UserRole.Coordinator,
      }),
    });
    answerEachWith(
      [fetchCoordinatorNotes, addCoordinatorNote, deleteCoordinatorNote],
      ok,
    );
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
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue(
      guardRefusal(403),
    );

    const response = await list(new Request("http://localhost"), params("m-1"));

    expect(response.status).toBe(403);
    expect(fetchCoordinatorNotes).not.toHaveBeenCalled();
  });
});
