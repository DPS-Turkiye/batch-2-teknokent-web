import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import { sessionAfterTeamChange } from "@/lib/client/organization";
import {
  cancelTeamChange,
  getTeamChanges,
  getTeamHistory,
  leaveTeam,
  requestLeave,
  requestRemoval,
} from "@/lib/client/team-changes";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";
import { appSession } from "@test/fixtures/session";
import { OWN_ORGANIZATION_PATH } from "@test/mocks/own-organization";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);
vi.mock("@/lib/client/organization", () => ({
  sessionAfterTeamChange: vi.fn(),
}));
vi.mock("@/lib/client/own-organization", async () =>
  (await import("@test/mocks/own-organization")).ownOrganizationMock(),
);

const calls: ClientCall[] = [
  {
    title: "getTeamChanges lists the team's change requests",
    call: () => getTeamChanges(),
    method: "get",
    args: ["/api/organizations/org%2F1/team-changes"],
  },
  {
    title: "requestLeave posts a leave request",
    call: () => requestLeave(),
    method: "post",
    args: ["/api/organizations/org%2F1/leave-request"],
  },
  {
    title: "requestRemoval posts a removal request for the encoded member",
    call: () => requestRemoval("mem/1"),
    method: "post",
    args: ["/api/organizations/org%2F1/members/mem%2F1/removal-request"],
  },
  {
    title: "cancelTeamChange posts to the encoded request's cancel action",
    call: () => cancelTeamChange("req/1"),
    method: "post",
    args: ["/api/organizations/org%2F1/team-changes/req%2F1/cancel"],
  },
  {
    title: "getTeamHistory reads the encoded user's team history",
    call: () => getTeamHistory("u/1"),
    method: "get",
    args: ["/api/users/u%2F1/team-history"],
  },
];

describe("team changes client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);

  it.each(["mem-2", null])(
    "leaveTeam names successor %s, then answers with the session read again, now without a startup",
    async (successorId) => {
      const session = appSession();
      vi.mocked(backendHttp.post).mockResolvedValue({ status: 200, data: {} });
      vi.mocked(sessionAfterTeamChange).mockResolvedValue(session);

      expect(await leaveTeam(successorId)).toEqual(session);
      expect(backendHttp.post).toHaveBeenCalledWith(
        `${OWN_ORGANIZATION_PATH}/leave`,
        { successorId },
      );
    },
  );
});
