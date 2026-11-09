import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/organization-members/route";
import {
  createOrganizationMember,
  fetchOrganizationMembers,
} from "@/lib/api/organization-members";
import { getSessionIds } from "@/lib/session";
import { SessionRequiredError } from "@/lib/server/session-error";

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

  it("GET returns 401 when there is no session instead of the demo organization", async () => {
    vi.mocked(getSessionIds).mockRejectedValue(new SessionRequiredError());

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      code: "SESSION_REQUIRED",
      message: "Etkin oturum bulunamadı.",
    });
    expect(fetchOrganizationMembers).not.toHaveBeenCalled();
  });

  it("POST scopes the new member to the session's own organization and user", async () => {
    vi.mocked(createOrganizationMember).mockResolvedValue({
      data: {},
      headers: {},
      status: 201,
    });

    await POST(
      new NextRequest("http://localhost/api/organization-members", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Yeni Üye",
          email: "yeni@x.demo",
          jobTitle: "Ürün",
          actorId: "founder-1",
          organizationId: "org-2",
        }),
      }),
    );

    expect(createOrganizationMember).toHaveBeenCalledWith("org-1", "user-1", {
      fullName: "Yeni Üye",
      email: "yeni@x.demo",
      jobTitle: "Ürün",
    });
  });
});
