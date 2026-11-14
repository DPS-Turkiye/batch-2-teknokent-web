import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/coordinator/programs/[id]/team-details/[organizationId]/stage/route";
import { UserRole } from "@/interfaces/session";
import { fetchProgramTeamDetail } from "@/lib/api/coordinator-programs";
import { fetchStartupProcess } from "@/lib/api/startup-process";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
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
}));
vi.mock("@/lib/server/require-coordinator", () => ({
  requireCoordinatorOrAdminSession: vi.fn(),
}));

const ok = backendResponse({});
const params = {
  params: Promise.resolve({ id: "program-1", organizationId: "org-1" }),
};

describe("coordinator team process route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue({
      ok: true,
      session: appSession({
        userId: "coordinator-1",
        role: UserRole.Coordinator,
      }),
    });
    answerEachWith([fetchProgramTeamDetail, fetchStartupProcess], ok);
  });

  it("reads the process of a team in the coordinator's program", async () => {
    expect((await GET(new Request("http://localhost"), params)).status).toBe(
      200,
    );
    expect(fetchProgramTeamDetail).toHaveBeenCalledWith(
      "coordinator-1",
      "program-1",
      "org-1",
    );
    expect(fetchStartupProcess).toHaveBeenCalledWith("org-1", "coordinator-1");
  });

  it("refuses a team outside the coordinator's programs", async () => {
    vi.mocked(fetchProgramTeamDetail).mockResolvedValue(
      backendRefusal(404, { message: "Not found" }),
    );

    expect((await GET(new Request("http://localhost"), params)).status).toBe(
      404,
    );
    expect(fetchStartupProcess).not.toHaveBeenCalled();
  });

  it("refuses anyone who is not a coordinator or admin", async () => {
    vi.mocked(requireCoordinatorOrAdminSession).mockResolvedValue(
      guardRefusal(403),
    );

    expect((await GET(new Request("http://localhost"), params)).status).toBe(
      403,
    );
    expect(fetchProgramTeamDetail).not.toHaveBeenCalled();
  });
});
