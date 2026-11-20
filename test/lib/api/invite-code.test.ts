import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkInviteCode } from "@/lib/api/invite-code";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

describe("invite code server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it("checks the code on the server's own login, naming the visitor's address", async () => {
    await checkInviteCode("ABCD2345", "203.0.113.7");

    expect(vi.mocked(backendRequest).mock.lastCall).toEqual([
      {
        method: "POST",
        url: "/api/auth/invite-code/check",
        data: { code: "ABCD2345" },
        headers: { "X-Menton-Client-Address": "203.0.113.7" },
      },
    ]);
  });

  it("sends no address header when it has none", async () => {
    await checkInviteCode("ABCD2345", null);

    expect(vi.mocked(backendRequest).mock.lastCall).toEqual([
      {
        method: "POST",
        url: "/api/auth/invite-code/check",
        data: { code: "ABCD2345" },
      },
    ]);
  });
});
