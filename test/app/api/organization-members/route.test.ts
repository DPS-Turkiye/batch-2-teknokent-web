import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/organization-members/route";
import {
  createOrganizationMember,
  fetchOrganizationMembers,
} from "@/lib/api/organization-members";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/organization-members", () => ({
  fetchOrganizationMembers: vi.fn(),
  createOrganizationMember: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
}));

describe("/api/organization-members", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "user-1",
      organizationId: "org-1",
    });
  });

  it("GET always scopes to the session's own organization, never a client-supplied one", async () => {
    vi.mocked(fetchOrganizationMembers).mockResolvedValue({
      data: [],
      headers: {},
      status: 200,
    });

    await GET();

    expect(fetchOrganizationMembers).toHaveBeenCalledWith("org-1");
  });

  it("POST scopes the new member to the session's own organization", async () => {
    vi.mocked(createOrganizationMember).mockResolvedValue({
      data: {},
      headers: {},
      status: 201,
    });

    await POST(
      new NextRequest("http://localhost/api/organization-members", {
        method: "POST",
        body: JSON.stringify({ fullName: "Yeni Üye", email: "yeni@x.demo" }),
      }),
    );

    expect(createOrganizationMember).toHaveBeenCalledWith("org-1", {
      fullName: "Yeni Üye",
      email: "yeni@x.demo",
    });
  });
});
