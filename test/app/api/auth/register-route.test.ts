import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/auth/register/[role]/route";
import { registerAccount } from "@/lib/api/auth";
import { backendRefusal } from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/auth")>()),
  registerAccount: vi.fn(),
}));

function register(headers: Record<string, string>) {
  return POST(
    new NextRequest("http://localhost/api/auth/register/member", {
      method: "POST",
      body: JSON.stringify({ inviteCode: "ABCD1234" }),
      headers: { authorization: "Bearer id-token", ...headers },
    }),
    { params: Promise.resolve({ role: "member" }) },
  );
}

describe("POST /api/auth/register/[role]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(registerAccount).mockResolvedValue(backendRefusal(400));
  });

  // The backend limits wrong team codes per visitor; the address comes from the request, never the browser's claim.
  it("names the visitor's address to the backend, ignoring one the browser sent itself", async () => {
    await register({
      "cloudfront-viewer-address": "203.0.113.7:51544",
      "x-menton-client-address": "1.2.3.4",
    });

    expect(registerAccount).toHaveBeenCalledWith(
      "member",
      { inviteCode: "ABCD1234" },
      "id-token",
      "203.0.113.7",
    );
  });

  it("names no address when the request carries no usable one", async () => {
    await register({ "x-menton-client-address": "1.2.3.4" });

    expect(registerAccount).toHaveBeenCalledWith(
      "member",
      { inviteCode: "ABCD1234" },
      "id-token",
      null,
    );
  });
});
