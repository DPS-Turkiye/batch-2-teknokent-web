import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  StartupFundingStage,
  type StartupProfileInput,
  type StartupStatusInput,
} from "@/interfaces/organization";
import {
  updateOrganization,
  updateOrganizationStatus,
} from "@/lib/api/organization";
import { backendRequest } from "@/lib/server/backend-client";
import { withForgedActor } from "@test/fixtures/forged-actor";
import { itemAt } from "@test/fixtures/list-assertions";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

// A body field named actorId must not replace the session user the backend
// authorizes on.
const profile: StartupProfileInput = {
  name: "Döngü",
  description: null,
  website: null,
  problem: null,
  solution: null,
  currentSolution: null,
  targetUser: null,
  sector: null,
  maturity: null,
  programLevel: null,
  supportAreas: [],
  fundingStage: StartupFundingStage.Seed,
  foundedYear: 2024,
};
const status: StartupStatusInput = {
  statusVersion: "v2",
  statusSummary: "MVP hazır",
  completionPercent: 60,
};

describe("organization server API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the session actor on a profile update", async () => {
    await updateOrganization(
      "org-1",
      "member-1",
      withForgedActor(profile, "lead-1"),
    );

    expect(
      itemAt(vi.mocked(backendRequest).mock.calls, 0)[0].data,
    ).toMatchObject({
      actorId: "member-1",
    });
  });

  it("keeps the session actor on a status update", async () => {
    await updateOrganizationStatus(
      "org-1",
      "member-1",
      withForgedActor(status, "lead-1"),
    );

    expect(
      itemAt(vi.mocked(backendRequest).mock.calls, 0)[0].data,
    ).toMatchObject({
      actorId: "member-1",
    });
  });
});
