import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/auth/password-reset/route";
import { sendPasswordResetEmail } from "@/lib/api/auth-email";

vi.mock("@/lib/api/auth-email", () => ({ sendPasswordResetEmail: vi.fn() }));

function reset(body: unknown) {
  return POST(
    new NextRequest("http://localhost/api/auth/password-reset", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/auth/password-reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sendPasswordResetEmail).mockResolvedValue({
      status: 204,
      data: undefined,
      headers: {},
    });
  });

  it("works signed out and forwards the trimmed address", async () => {
    const response = await reset({ email: " mentor@metu.edu.tr " });

    expect(response.status).toBe(204);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith("mentor@metu.edu.tr");
  });

  it("passes a backend failure through so the page can fall back", async () => {
    vi.mocked(sendPasswordResetEmail).mockResolvedValue({
      status: 503,
      data: undefined,
      headers: {},
    });

    expect((await reset({ email: "mentor@metu.edu.tr" })).status).toBe(503);
  });

  it("rejects a request without an address", async () => {
    const response = await reset({});

    expect(response.status).toBe(400);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});
