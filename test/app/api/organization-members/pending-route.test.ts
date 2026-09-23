import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE } from "@/app/api/organization-members/pending/[pendingId]/route";
import { GET } from "@/app/api/organization-members/pending/route";
import {
  fetchPendingMembers,
  removePendingMember,
} from "@/lib/api/organization-members";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/organization-members", () => ({
  fetchPendingMembers: vi.fn(),
  removePendingMember: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
}));

describe("/api/organization-members/pending", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "founder",
      organizationId: "org-1",
    });
  });

  it("lists the session organization's waiting teammates as the session user", async () => {
    vi.mocked(fetchPendingMembers).mockResolvedValue({
      status: 200,
      data: [{ id: "p1", fullName: "Ece Kaya" }],
      headers: {},
    } as never);

    const response = await GET();

    expect(fetchPendingMembers).toHaveBeenCalledWith("org-1", "founder");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      { id: "p1", fullName: "Ece Kaya" },
    ]);
  });

  it("drops a waiting teammate as the session user", async () => {
    vi.mocked(removePendingMember).mockResolvedValue({
      status: 204,
      data: "",
      headers: {},
    } as never);

    const response = await DELETE(
      new NextRequest("http://localhost/api/organization-members/pending/p1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ pendingId: "p1" }) },
    );

    expect(removePendingMember).toHaveBeenCalledWith("org-1", "p1", "founder");
    expect(response.status).toBe(204);
  });

  it("passes the backend's refusal through when a member tries to drop someone", async () => {
    vi.mocked(removePendingMember).mockResolvedValue({
      status: 403,
      data: { message: "Yalnızca kurucu çıkarabilir." },
      headers: {},
    } as never);

    const response = await DELETE(
      new NextRequest("http://localhost/api/organization-members/pending/p1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ pendingId: "p1" }) },
    );

    expect(response.status).toBe(403);
  });

  it("asks for a session when there is none", async () => {
    vi.mocked(getSessionIds).mockRejectedValue(new SessionRequiredError());

    const response = await GET();

    expect(response.status).toBe(401);
    expect(fetchPendingMembers).not.toHaveBeenCalled();
  });
});
