import { describe, vi } from "vitest";

import { getTeamMoveOptions, moveMemberToTeam } from "@/lib/client/team-moves";
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

vi.mock("@/lib/client/bearer", () => ({
  bearerHeader: vi.fn().mockResolvedValue({ Authorization: "Bearer token-1" }),
}));

const calls: ClientCall[] = [
  {
    title:
      "getTeamMoveOptions reads the encoded person's options with the token",
    call: () => getTeamMoveOptions("user/1"),
    method: "get",
    args: [
      "/api/users/user%2F1/team-move",
      { headers: { Authorization: "Bearer token-1" } },
    ],
  },
  {
    title: "moveMemberToTeam posts the target team with the token",
    call: () => moveMemberToTeam("user-1", "org-2"),
    method: "post",
    args: [
      "/api/users/user-1/team-move",
      { targetOrganizationId: "org-2" },
      { headers: { Authorization: "Bearer token-1" } },
    ],
  },
];

describe("team moves browser client", () => {
  itSendsEachClientCall(calls);
});
