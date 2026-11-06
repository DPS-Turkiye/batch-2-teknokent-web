import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/auth/verification-email/route";
import { sendVerificationEmail } from "@/lib/api/auth-email";

vi.mock("@/lib/api/auth-email", () => ({ sendVerificationEmail: vi.fn() }));

function send(authorization = "Bearer token-1") {
  return POST(
    new NextRequest("http://localhost/api/auth/verification-email", {
      method: "POST",
      headers: { Authorization: authorization },
    }),
  );
}

describe("POST /api/auth/verification-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sendVerificationEmail).mockResolvedValue({
      status: 204,
      data: undefined,
      headers: {},
    });
  });

  it("asks the backend to mail the caller's own address", async () => {
    const response = await send();

    expect(response.status).toBe(204);
    expect(sendVerificationEmail).toHaveBeenCalledWith("token-1");
  });

  it("passes the backend's limit through so the page can ask to wait", async () => {
    vi.mocked(sendVerificationEmail).mockResolvedValue({
      status: 429,
      data: undefined,
      headers: {},
    });

    expect((await send()).status).toBe(429);
  });

  it("rejects a request without a token", async () => {
    const response = await send("");

    expect(response.status).toBe(400);
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });
});
