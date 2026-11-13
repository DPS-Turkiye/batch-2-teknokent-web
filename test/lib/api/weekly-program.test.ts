import { beforeEach, describe, expect, it, vi } from "vitest";

import { readWeeklyProgram, saveWeeklyProgram } from "@/lib/api/weekly-program";
import { UPLOAD_TIMEOUT_MS } from "@/lib/http-client";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

describe("weekly program server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it("reads an encoded program's file with an upload's timeout, as the token's owner", async () => {
    await readWeeklyProgram("coord-1", "prog/1", "doc-1", "token-1");

    expect(backendRequest).toHaveBeenCalledWith(
      {
        method: "POST",
        url: "/api/coordinator/programs/prog%2F1/weekly-program/read",
        data: { actorId: "coord-1", documentId: "doc-1" },
        timeout: UPLOAD_TIMEOUT_MS,
      },
      { idToken: "token-1" },
    );
  });

  it("falls back to the service credentials when there is no token", async () => {
    await readWeeklyProgram("coord-1", "prog-1", "doc-1");

    expect(backendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/api/coordinator/programs/prog-1/weekly-program/read",
      }),
      { idToken: undefined },
    );
  });

  it("saves the reviewed plan with the actor", async () => {
    const input = {
      documentId: "doc-1",
      weeks: [],
      phases: [],
      seenPhaseCount: 2,
      seenWeekCount: 5,
      keepPast: false,
    };

    await saveWeeklyProgram("coord-1", "prog/1", input);

    expect(backendRequest).toHaveBeenCalledWith({
      method: "PUT",
      url: "/api/coordinator/programs/prog%2F1/weekly-program",
      data: { actorId: "coord-1", ...input },
    });
  });
});
