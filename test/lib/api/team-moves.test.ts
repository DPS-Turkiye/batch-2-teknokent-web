import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchTeamMoveOptions, moveMemberToTeam } from "@/lib/api/team-moves";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

describe("team moves backend client", () => {
  beforeEach(() => vi.clearAllMocks());

  it("asks for the move options with the caller's own token", async () => {
    await fetchTeamMoveOptions("user/1", "id-token");

    expect(backendRequest).toHaveBeenCalledWith(
      { method: "GET", url: "/api/users/user%2F1/team-move" },
      { idToken: "id-token" },
    );
  });

  it("posts the target team with the caller's own token", async () => {
    await moveMemberToTeam("user-1", "org-2", "id-token");

    expect(backendRequest).toHaveBeenCalledWith(
      {
        method: "POST",
        url: "/api/users/user-1/team-move",
        data: { targetOrganizationId: "org-2" },
      },
      { idToken: "id-token" },
    );
  });
});
