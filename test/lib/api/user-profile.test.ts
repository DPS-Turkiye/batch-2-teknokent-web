import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchUserProfile } from "@/lib/api/user-profile";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

describe("user profile server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it("reads an encoded user's profile as the viewer, on the server's own credentials", async () => {
    await fetchUserProfile("user/1", "viewer-1");

    expect(vi.mocked(backendRequest).mock.lastCall).toEqual([
      {
        method: "GET",
        url: "/api/users/user%2F1/profile",
        params: { actorId: "viewer-1" },
      },
      undefined,
    ]);
  });

  it("reads the profile signed with the onboarding token when one is given", async () => {
    await fetchUserProfile("user/1", "user/1", "id-token");

    expect(vi.mocked(backendRequest).mock.lastCall).toEqual([
      {
        method: "GET",
        url: "/api/users/user%2F1/profile",
        params: { actorId: "user/1" },
      },
      { idToken: "id-token" },
    ]);
  });
});
