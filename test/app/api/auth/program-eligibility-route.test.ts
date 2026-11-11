import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/auth/register/program-eligibility/route";
import { fetchProgramEligibility } from "@/lib/api/auth";

vi.mock("@/lib/api/auth", () => ({ fetchProgramEligibility: vi.fn() }));

function ask(query: string, authorization = "Bearer token-1") {
  return GET(
    new NextRequest(
      `http://localhost/api/auth/register/program-eligibility${query}`,
      { headers: { Authorization: authorization } },
    ),
  );
}

describe("GET /api/auth/register/program-eligibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchProgramEligibility).mockResolvedValue({
      status: 200,
      data: { eligible: false, message: "Listede değil." },
      headers: {},
    });
  });

  it("asks the backend with the caller's own token", async () => {
    const response = await ask("?programId=iskur");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      eligible: false,
      message: "Listede değil.",
    });
    expect(fetchProgramEligibility).toHaveBeenCalledWith("iskur", "token-1");
  });

  it("needs both a token and a program", async () => {
    expect((await ask("?programId=iskur", "")).status).toBe(400);
    expect((await ask("")).status).toBe(400);
    expect(fetchProgramEligibility).not.toHaveBeenCalled();
  });
});
