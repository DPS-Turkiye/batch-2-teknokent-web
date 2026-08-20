import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/demo-accounts/route";
import { UserRole } from "@/interfaces/session";
import { fetchUsers } from "@/lib/api/accounts";

vi.mock("@/lib/api/accounts", () => ({
  fetchUsers: vi.fn(),
}));

function requestWithRole(role?: string) {
  const url = role
    ? `http://localhost/api/demo-accounts?role=${role}`
    : "http://localhost/api/demo-accounts";
  return new NextRequest(url);
}

describe("GET /api/demo-accounts", () => {
  it("defaults to MENTEE when no role is given", async () => {
    vi.mocked(fetchUsers).mockResolvedValue({
      data: [],
      headers: {},
      status: 200,
    });

    await GET(requestWithRole());

    expect(fetchUsers).toHaveBeenCalledWith(UserRole.Mentee);
  });

  it("passes through MENTOR when requested", async () => {
    vi.mocked(fetchUsers).mockResolvedValue({
      data: [],
      headers: {},
      status: 200,
    });

    await GET(requestWithRole(UserRole.Mentor));

    expect(fetchUsers).toHaveBeenCalledWith(UserRole.Mentor);
  });

  it("does not accept an arbitrary role value", async () => {
    vi.mocked(fetchUsers).mockResolvedValue({
      data: [],
      headers: {},
      status: 200,
    });

    await GET(requestWithRole("ADMIN"));

    expect(fetchUsers).toHaveBeenCalledWith(UserRole.Mentee);
  });
});
