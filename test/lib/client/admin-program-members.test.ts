import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ProgramMemberKind,
  type ProgramTeamMove,
} from "@/interfaces/admin-overview";
import {
  assignToProgram,
  moveStartupToProgram,
} from "@/lib/client/admin-program-members";
import { ClientApiError } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";
import { createAxiosResponse } from "@test/fixtures/health";

vi.mock("@/lib/http-client", () => ({
  httpClient: { post: vi.fn() },
}));

const move: ProgramTeamMove = {
  id: "move-1",
  organizationId: "org 1",
  fromProgramId: "program-1",
  fromProgramName: "Ön Kuluçka 2026",
  toProgramId: "prog/2",
  toProgramName: "Kuluçka 2026",
  movedAt: "2026-11-13T12:00:00Z",
  withdrawnRequests: 0,
};

describe("admin program members client", () => {
  beforeEach(() => {
    vi.mocked(httpClient.post).mockReset();
  });

  it("assigns a member under the kind's path segment", async () => {
    vi.mocked(httpClient.post).mockResolvedValue(
      createAxiosResponse(undefined, 204),
    );

    await assignToProgram("prog/2", ProgramMemberKind.Mentors, "mentor 1");

    expect(httpClient.post).toHaveBeenCalledWith(
      "/api/admin/programs/prog%2F2/mentors/mentor%201",
    );
  });

  it("moves a startup into the program in the path, naming the one it leaves", async () => {
    vi.mocked(httpClient.post).mockResolvedValue(
      createAxiosResponse(move, 200),
    );

    await expect(
      moveStartupToProgram("prog/2", "org 1", "program-1"),
    ).resolves.toEqual(move);

    expect(httpClient.post).toHaveBeenCalledWith(
      "/api/admin/programs/prog%2F2/startups/org%201/move",
      { fromProgramId: "program-1" },
    );
  });

  it("surfaces the backend's reason when the move is refused", async () => {
    vi.mocked(httpClient.post).mockResolvedValue(
      createAxiosResponse(
        { code: "INVALID_REQUEST", message: "Takım zaten bu programda." },
        400,
      ),
    );

    await expect(
      moveStartupToProgram("program-2", "org-1", "program-1"),
    ).rejects.toThrow(
      new ClientApiError("Takım zaten bu programda.", 400, "INVALID_REQUEST"),
    );
  });
});
