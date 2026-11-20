import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/auth/invite-code/route";
import { checkInviteCode } from "@/lib/api/invite-code";

vi.mock("@/lib/api/invite-code", () => ({ checkInviteCode: vi.fn() }));

function check(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new NextRequest("http://localhost/api/auth/invite-code", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
      headers,
    }),
  );
}

describe("POST /api/auth/invite-code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkInviteCode).mockResolvedValue({
      status: 200,
      data: { valid: true, teamName: "Yıldız Team" },
      headers: {},
    });
  });

  it("works signed out and forwards the trimmed code with the visitor's address", async () => {
    const response = await check(
      { code: " ABCD2345 " },
      { "x-forwarded-for": "198.51.100.1" },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      valid: true,
      teamName: "Yıldız Team",
    });
    expect(checkInviteCode).toHaveBeenCalledWith("ABCD2345", "198.51.100.1");
  });

  it("passes the backend's rate limit through", async () => {
    vi.mocked(checkInviteCode).mockResolvedValue({
      status: 429,
      data: { valid: false, teamName: null },
      headers: {},
    });

    expect((await check({ code: "ABCD2345" })).status).toBe(429);
  });

  it.each([
    ["no code", {}],
    ["a blank code", { code: "  " }],
    ["an overlong code", { code: "A".repeat(33) }],
    ["a code that is not text", { code: 12345678 }],
    ["malformed JSON", "{"],
  ])("refuses %s without asking the backend", async (_label, body) => {
    expect((await check(body)).status).toBe(400);
    expect(checkInviteCode).not.toHaveBeenCalled();
  });

  it("answers a translated error when the backend cannot be reached", async () => {
    vi.mocked(checkInviteCode).mockRejectedValue(new Error("down"));

    const response = await check({ code: "ABCD2345" });

    expect(response.status).toBe(502);
  });
});
