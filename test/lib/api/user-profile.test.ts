import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpMethod } from "@/lib/http-method";
import { fetchUserProfile } from "@/lib/api/user-profile";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

describe("profile reads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("names who is asking for a profile", async () => {
    await fetchUserProfile("person-2", "viewer-1");

    expect(backendRequest).toHaveBeenCalledWith(
      {
        method: HttpMethod.Get,
        url: "/api/users/person-2/profile",
        params: { actorId: "viewer-1" },
      },
      undefined,
    );
  });

  it("forwards a Firebase token when it has one", async () => {
    await fetchUserProfile("user-9", "user-9", "token-9");

    expect(backendRequest).toHaveBeenCalledWith(
      {
        method: HttpMethod.Get,
        url: "/api/users/user-9/profile",
        params: { actorId: "user-9" },
      },
      { idToken: "token-9" },
    );
  });
});
