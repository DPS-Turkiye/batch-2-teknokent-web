import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  PUT as edit,
  DELETE as remove,
} from "@/app/api/coordinator/programs/[id]/assignments/[assignmentId]/route";
import {
  POST as give,
  GET as list,
} from "@/app/api/coordinator/programs/[id]/assignments/route";
import { UserRole } from "@/interfaces/session";
import {
  createProgramAssignment,
  deleteProgramAssignment,
  fetchProgramAssignments,
  updateProgramAssignment,
} from "@/lib/api/program-assignments";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
import {
  answerEachWith,
  backendResponse,
  guardRefusal,
} from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/program-assignments", () => ({
  createProgramAssignment: vi.fn(),
  deleteProgramAssignment: vi.fn(),
  fetchProgramAssignments: vi.fn(),
  updateProgramAssignment: vi.fn(),
}));
vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorOrAdminSession: vi.fn(),
}));

const params = { params: Promise.resolve({ id: "program-1" }) };
const editParams = {
  params: Promise.resolve({ id: "program-1", assignmentId: "odev-1" }),
};
const editRequest = (body: unknown) =>
  new Request("http://localhost", {
    method: "PUT",
    body: JSON.stringify(body),
  });

describe("program assignment routes", () => {
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
      [
        createProgramAssignment,
        deleteProgramAssignment,
        fetchProgramAssignments,
        updateProgramAssignment,
      ],
      backendResponse([]),
    );
  });

  it("reads and gives a program's Ödevler as the session's coordinator, ignoring a forged actor", async () => {
    await list(new Request("http://localhost"), params);
    await give(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          actorId: "forged",
          title: "Pazar araştırması",
          description: "Hedef pazarı anlat.",
          fileRequired: true,
        }),
      }),
      params,
    );

    expect(fetchProgramAssignments).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
    );
    expect(createProgramAssignment).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      {
        title: "Pazar araştırması",
        description: "Hedef pazarı anlat.",
        dueDate: null,
        phaseId: null,
        fileRequired: true,
      },
    );
  });

  it("refuses anyone who is not a coordinator or an admin", async () => {
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue(
      guardRefusal(403),
    );

    expect((await list(new Request("http://localhost"), params)).status).toBe(
      403,
    );
    expect(
      (
        await give(
          new Request("http://localhost", {
            method: "POST",
            body: JSON.stringify({ title: "Pazar araştırması" }),
          }),
          params,
        )
      ).status,
    ).toBe(403);
    expect(fetchProgramAssignments).not.toHaveBeenCalled();
    expect(createProgramAssignment).not.toHaveBeenCalled();
  });

  it("edits an Ödev as the session's coordinator, ignoring a forged actor, and clears a left-out date", async () => {
    await edit(
      editRequest({ actorId: "forged", title: "Pazar analizi" }),
      editParams,
    );

    expect(updateProgramAssignment).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "odev-1",
      { title: "Pazar analizi", description: null, dueDate: null },
    );
  });

  it("refuses an edit from anyone who is not a coordinator or an admin", async () => {
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue(
      guardRefusal(403),
    );

    expect(
      (await edit(editRequest({ title: "Pazar analizi" }), editParams)).status,
    ).toBe(403);
    expect(updateProgramAssignment).not.toHaveBeenCalled();
  });

  it("deletes an Ödev as the session's coordinator", async () => {
    const response = await remove(
      new Request("http://localhost", { method: "DELETE" }),
      editParams,
    );

    expect(response.ok).toBe(true);
    expect(deleteProgramAssignment).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "odev-1",
    );
  });

  it("refuses a delete from anyone who is not a coordinator or an admin", async () => {
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue(
      guardRefusal(403),
    );

    expect(
      (
        await remove(
          new Request("http://localhost", { method: "DELETE" }),
          editParams,
        )
      ).status,
    ).toBe(403);
    expect(deleteProgramAssignment).not.toHaveBeenCalled();
  });
});
