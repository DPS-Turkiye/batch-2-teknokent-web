import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cancelTeamChange,
  fetchTeamChanges,
  fetchTeamHistory,
  leaveTeam,
  requestLeave,
  requestRemoval,
} from "@/lib/api/team-changes";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

const ORG_URL = "/api/organizations/org%2F1";

type RequestCase = [
  description: string,
  call: () => Promise<unknown>,
  request: AxiosRequestConfig,
];

const cases: RequestCase[] = [
  [
    "lists the startup's team changes",
    () => fetchTeamChanges("org/1", "member-1"),
    {
      method: "GET",
      url: `${ORG_URL}/team-changes`,
      params: { actorId: "member-1" },
    },
  ],
  [
    "asks to leave the startup",
    () => requestLeave("org/1", "member-1"),
    {
      method: "POST",
      url: `${ORG_URL}/leave-request`,
      params: { actorId: "member-1" },
    },
  ],
  [
    "asks to remove an encoded member",
    () => requestRemoval("org/1", "member 2", "founder-1"),
    {
      method: "POST",
      url: `${ORG_URL}/members/member%202/removal-request`,
      params: { actorId: "founder-1" },
    },
  ],
  [
    "cancels an encoded team change request",
    () => cancelTeamChange("org/1", "req 1", "member-1"),
    {
      method: "POST",
      url: `${ORG_URL}/team-changes/req%201/cancel`,
      params: { actorId: "member-1" },
    },
  ],
  [
    "lets the leader leave and hand the startup to a successor",
    () => leaveTeam("org/1", "founder-1", "member-2"),
    {
      method: "POST",
      url: `${ORG_URL}/leave`,
      data: { actorId: "founder-1", successorId: "member-2" },
    },
  ],
  [
    "lets the last member leave with no successor",
    () => leaveTeam("org/1", "founder-1", null),
    {
      method: "POST",
      url: `${ORG_URL}/leave`,
      data: { actorId: "founder-1", successorId: null },
    },
  ],
  [
    "reads an encoded user's team history",
    () => fetchTeamHistory("user/2", "coord-1"),
    {
      method: "GET",
      url: "/api/users/user%2F2/team-history",
      params: { actorId: "coord-1" },
    },
  ],
];

describe("team changes server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
