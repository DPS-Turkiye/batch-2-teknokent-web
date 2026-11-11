import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GateBadgeState } from "@/interfaces/badges";
import {
  awardGateBadge,
  fetchAdminStudents,
  fetchMyAchievements,
  fetchMyBadges,
  fetchProgramBadgeRoster,
  fetchUserBadges,
  revokeGateBadge,
} from "@/lib/api/badges";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

const BADGES_URL = "/api/coordinator/programs/prog%2F1/badges";

type RequestCase = [
  description: string,
  call: () => Promise<unknown>,
  request: AxiosRequestConfig,
];

const cases: RequestCase[] = [
  [
    "lists the actor's own badges",
    () => fetchMyBadges("student-1"),
    {
      method: "GET",
      url: "/api/badges/mine",
      params: { actorId: "student-1" },
    },
  ],
  [
    "lists the actor's achievement progress",
    () => fetchMyAchievements("student-1"),
    {
      method: "GET",
      url: "/api/badges/mine/achievements",
      params: { actorId: "student-1" },
    },
  ],
  [
    "reads another user's public badges at the encoded path",
    () => fetchUserBadges("user/2"),
    { method: "GET", url: "/api/users/user%2F2/badges" },
  ],
  [
    "lists the whole roster when no state is picked",
    () => fetchProgramBadgeRoster("coord-1", "prog/1", null),
    {
      method: "GET",
      url: `${BADGES_URL}/roster`,
      params: { actorId: "coord-1" },
    },
  ],
  [
    "filters the roster by the picked state",
    () => fetchProgramBadgeRoster("coord-1", "prog/1", GateBadgeState.Revoked),
    {
      method: "GET",
      url: `${BADGES_URL}/roster`,
      params: { actorId: "coord-1", state: GateBadgeState.Revoked },
    },
  ],
  [
    "awards the gate badge to a user",
    () => awardGateBadge("coord-1", "prog/1", "student-1"),
    {
      method: "POST",
      url: `${BADGES_URL}/awards`,
      data: { actorId: "coord-1", userId: "student-1" },
    },
  ],
  [
    "revokes an encoded award with the reason in the body",
    () => revokeGateBadge("coord-1", "prog/1", "award 1", "Kopya"),
    {
      method: "POST",
      url: `${BADGES_URL}/awards/award%201/revoke`,
      data: { actorId: "coord-1", reason: "Kopya" },
    },
  ],
  [
    "lists every admin student when no state is picked",
    () => fetchAdminStudents("admin-1", null),
    {
      method: "GET",
      url: "/api/admin/students",
      params: { actorId: "admin-1" },
    },
  ],
  [
    "filters admin students by the picked state",
    () => fetchAdminStudents("admin-1", GateBadgeState.Active),
    {
      method: "GET",
      url: "/api/admin/students",
      params: { actorId: "admin-1", state: GateBadgeState.Active },
    },
  ],
];

describe("badges server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
