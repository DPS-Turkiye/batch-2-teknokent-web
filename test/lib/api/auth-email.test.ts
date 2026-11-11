import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/lib/api/auth-email";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

describe("auth e-mail server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it("sends the verification e-mail signed with the token, so it only reaches the token's own address", async () => {
    await sendVerificationEmail("id-token");

    expect(vi.mocked(backendRequest).mock.lastCall).toEqual([
      { method: "POST", url: "/api/auth/register/verification-email" },
      { idToken: "id-token" },
    ]);
  });

  it("asks for a password reset with the server's own credentials", async () => {
    await sendPasswordResetEmail("ada@x.demo");

    expect(vi.mocked(backendRequest).mock.lastCall).toEqual([
      {
        method: "POST",
        url: "/api/auth/password-reset",
        data: { email: "ada@x.demo" },
      },
    ]);
  });
});
