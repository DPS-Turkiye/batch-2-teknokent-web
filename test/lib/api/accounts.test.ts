import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserAccountStatus } from "@/interfaces/session";
import { fetchUser, fetchUsers } from "@/lib/api/accounts";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

describe("account reads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("names the admin asking for the account list", async () => {
    await fetchUsers("admin-1", { status: UserAccountStatus.Pending });

    expect(backendRequest).toHaveBeenCalledWith({
      method: HttpMethod.Get,
      url: "/api/users",
      params: { actorId: "admin-1", status: UserAccountStatus.Pending },
    });
  });

  it("names who is asking for an account", async () => {
    await fetchUser("person-2", "viewer-1", 3000);

    expect(backendRequest).toHaveBeenCalledWith({
      method: HttpMethod.Get,
      url: "/api/users/person-2",
      params: { actorId: "viewer-1" },
      timeout: 3000,
    });
  });
});
