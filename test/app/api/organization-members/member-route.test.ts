import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, PATCH } from "@/app/api/organization-members/[memberId]/route";
import {
  removeOrganizationMember,
  updateOrganizationMember,
} from "@/lib/api/organization-members";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/organization-members", () => ({
  removeOrganizationMember: vi.fn(),
  updateOrganizationMember: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
}));

const url = "http://localhost/api/organization-members/cto";
const context = { params: Promise.resolve({ memberId: "cto" }) };

describe("/api/organization-members/[memberId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "founder",
      organizationId: "org-1",
    });
  });

  it("edits a member as the session user", async () => {
    vi.mocked(updateOrganizationMember).mockResolvedValue({
      status: 200,
      data: { id: "cto" },
      headers: {},
    } as never);

    const response = await PATCH(
      new NextRequest(url, {
        method: "PATCH",
        body: JSON.stringify({ fullName: "Kerem Aksoy", jobTitle: "CTO" }),
      }),
      context,
    );

    expect(updateOrganizationMember).toHaveBeenCalledWith(
      "org-1",
      "cto",
      "founder",
      {
        fullName: "Kerem Aksoy",
        jobTitle: "CTO",
      },
    );
    expect(response.status).toBe(200);
  });

  it("removes a member and answers with no content", async () => {
    vi.mocked(removeOrganizationMember).mockResolvedValue({
      status: 204,
      data: null,
      headers: {},
    } as never);

    const response = await DELETE(new NextRequest(url), context);

    expect(removeOrganizationMember).toHaveBeenCalledWith(
      "org-1",
      "cto",
      "founder",
    );
    expect(response.status).toBe(204);
  });

  it("passes on a refusal from the backend", async () => {
    vi.mocked(removeOrganizationMember).mockResolvedValue({
      status: 400,
      data: {
        message: "Only the organization founder can remove team members",
      },
      headers: {},
    } as never);

    const response = await DELETE(new NextRequest(url), context);

    expect(response.status).toBe(400);
  });
});
