import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GET,
  PUT,
} from "@/app/api/coordinator/programs/[id]/team-details/[organizationId]/stage/route";
import { UserRole } from "@/interfaces/session";
import { StartupStage } from "@/interfaces/startup-process";
import { fetchProgramTeamDetail } from "@/lib/api/coordinator-programs";
import {
  fetchStartupProcess,
  updateProcessStage,
} from "@/lib/api/startup-process";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";
import {
  answerEachWith,
  backendRefusal,
  backendResponse,
  guardRefusal,
} from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/coordinator-programs", () => ({
  fetchProgramTeamDetail: vi.fn(),
}));
vi.mock("@/lib/api/startup-process", () => ({
  fetchStartupProcess: vi.fn(),
  updateProcessStage: vi.fn(),
}));
vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorSession: vi.fn(),
}));

const ok = backendResponse({});
const params = {
  params: Promise.resolve({ id: "program-1", organizationId: "org-1" }),
};
const put = (value: unknown) =>
  new Request("http://localhost", {
    method: "PUT",
    body: JSON.stringify(value),
  });

describe("coordinator team stage route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorSession).mockResolvedValue({
      ok: true,
      session: appSession({
        userId: "coordinator-1",
        role: UserRole.Coordinator,
      }),
    });
    answerEachWith(
      [fetchProgramTeamDetail, fetchStartupProcess, updateProcessStage],
      ok,
    );
  });

  it("reads and changes the stage of a team in the coordinator's program", async () => {
    expect((await GET(new Request("http://localhost"), params)).status).toBe(
      200,
    );
    expect(fetchProgramTeamDetail).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "org-1",
    );
    expect(fetchStartupProcess).toHaveBeenCalledWith("org-1", "coordinator-1");

    expect((await PUT(put({ stage: "MARKET" }), params)).status).toBe(200);
    expect(updateProcessStage).toHaveBeenCalledWith(
      "org-1",
      "coordinator-1",
      StartupStage.Market,
    );
  });

  it("refuses a team outside the coordinator's programs", async () => {
    vi.mocked(fetchProgramTeamDetail).mockResolvedValue(
      backendRefusal(404, { message: "Not found" }),
    );

    expect((await PUT(put({ stage: "MARKET" }), params)).status).toBe(404);
    expect((await GET(new Request("http://localhost"), params)).status).toBe(
      404,
    );
    expect(updateProcessStage).not.toHaveBeenCalled();
    expect(fetchStartupProcess).not.toHaveBeenCalled();
  });

  it("refuses anyone who is not a coordinator or admin", async () => {
    vi.mocked(requireCoordinatorSession).mockResolvedValue(guardRefusal(403));

    expect((await PUT(put({ stage: "MARKET" }), params)).status).toBe(403);
    expect(fetchProgramTeamDetail).not.toHaveBeenCalled();
    expect(updateProcessStage).not.toHaveBeenCalled();
  });

  it("rejects a stage that does not exist", async () => {
    const response = await PUT(put({ stage: "LAUNCH" }), params);

    expect(response.status).toBe(400);
    expect(updateProcessStage).not.toHaveBeenCalled();
  });
});
