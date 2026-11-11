import { beforeEach, describe, vi } from "vitest";

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

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const calls: ClientCall[] = [
  {
    title: "getTeamChanges lists the team's change requests",
    call: () => getTeamChanges(),
    method: "get",
    args: ["/api/team-changes"],
  },
  {
    title: "requestLeave posts a leave request",
    call: () => requestLeave(),
    method: "post",
    args: ["/api/team-changes/leave-request"],
  },
  {
    title: "requestRemoval posts a removal request for the encoded member",
    call: () => requestRemoval("mem/1"),
    method: "post",
    args: ["/api/organization-members/mem%2F1/removal-request"],
  },
  {
    title: "cancelTeamChange posts to the encoded request's cancel action",
    call: () => cancelTeamChange("req/1"),
    method: "post",
    args: ["/api/team-changes/req%2F1/cancel"],
  },
  {
    title: "leaveTeam names the successor who takes over",
    call: () => leaveTeam("mem-2"),
    method: "post",
    args: ["/api/team-changes/leave", { successorId: "mem-2" }],
  },
  {
    title: "leaveTeam sends a null successor when nobody takes over",
    call: () => leaveTeam(null),
    method: "post",
    args: ["/api/team-changes/leave", { successorId: null }],
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

  itSendsEachClientCall(calls);
});
