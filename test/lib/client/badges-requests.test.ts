import { beforeEach, describe, vi } from "vitest";

import { GateBadgeState } from "@/interfaces/badges";
import { backendHttp } from "@/lib/client/backend-http";
import {
  getAdminStudents,
  getMyAchievements,
  getMyBadges,
  getProgramBadgeRoster,
  getUserBadges,
  postGateBadgeAward,
  postGateBadgeRevoke,
} from "@/lib/client/badges";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const BADGES = "/api/coordinator/programs/prog%2F1/badges";

const calls: ClientCall[] = [
  {
    title: "getMyBadges lists the signed-in user's badges",
    call: () => getMyBadges(),
    method: "get",
    args: ["/api/badges/mine"],
  },
  {
    title: "getMyAchievements lists the user's achievement progress",
    call: () => getMyAchievements(),
    method: "get",
    args: ["/api/badges/mine/achievements"],
  },
  {
    title: "getUserBadges reads another user's public badges",
    call: () => getUserBadges("u/1"),
    method: "get",
    args: ["/api/users/u%2F1/badges"],
  },
  {
    title: "getProgramBadgeRoster lists everyone when no state is chosen",
    call: () => getProgramBadgeRoster("prog/1", null),
    method: "get",
    args: [`${BADGES}/roster`, undefined],
  },
  {
    title: "getProgramBadgeRoster narrows to the chosen state",
    call: () => getProgramBadgeRoster("prog/1", GateBadgeState.Expired),
    method: "get",
    args: [`${BADGES}/roster`, { params: { state: GateBadgeState.Expired } }],
  },
  {
    title: "postGateBadgeAward awards the badge to the user",
    call: () => postGateBadgeAward("prog/1", "u-1"),
    method: "post",
    args: [`${BADGES}/awards`, { userId: "u-1" }],
  },
  {
    title:
      "postGateBadgeRevoke revokes the encoded award with the trimmed reason",
    call: () => postGateBadgeRevoke("prog/1", "a/1", "  Yanlış verildi "),
    method: "post",
    args: [`${BADGES}/awards/a%2F1/revoke`, { reason: "Yanlış verildi" }],
  },
  {
    title: "getAdminStudents lists every student when no state is chosen",
    call: () => getAdminStudents(null),
    method: "get",
    args: ["/api/admin/students", undefined],
  },
  {
    title: "getAdminStudents narrows to the chosen state",
    call: () => getAdminStudents(GateBadgeState.Active),
    method: "get",
    args: ["/api/admin/students", { params: { state: GateBadgeState.Active } }],
  },
];

describe("badges client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);
});
