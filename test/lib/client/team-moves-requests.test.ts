import { describe, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import { getTeamMoveOptions, moveMemberToTeam } from "@/lib/client/team-moves";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const calls: ClientCall[] = [
  {
    title:
      "getTeamMoveOptions reads the encoded person's options with the token",
    call: () => getTeamMoveOptions("user/1"),
    method: "get",
    args: ["/api/users/user%2F1/team-move"],
  },
  {
    title: "moveMemberToTeam posts the target team with the token",
    call: () => moveMemberToTeam("user-1", "org-2"),
    method: "post",
    args: ["/api/users/user-1/team-move", { targetOrganizationId: "org-2" }],
  },
];

describe("team moves browser client", () => {
  itSendsEachClientCall(calls, backendHttp);
});
