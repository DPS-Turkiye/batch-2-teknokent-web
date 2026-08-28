import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/organizations/invite-code/route";
import {
  fetchInviteCode,
  regenerateInviteCode,
} from "@/lib/api/organization-invite";
import { UserRole, type AppSession } from "@/interfaces/session";
import { getSessionUser } from "@/lib/session";

vi.mock("@/lib/api/organization-invite", () => ({
  fetchInviteCode: vi.fn(),
  regenerateInviteCode: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionUser: vi.fn(),
}));

function founderSession(): AppSession {
  return {
    userId: "founder-1",
    email: "deniz@greenloop.demo",
    fullName: "Deniz Arslan",
    jobTitle: "Kurucu",
    role: UserRole.Mentee,
    organizationId: "org-1",
    organizationName: "GreenLoop",
  };
}

describe("/api/organizations/invite-code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET rejects a session without an organization", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: "mentor-1",
      email: "ece@mentor.demo",
      fullName: "Ece Demir",
      jobTitle: "Mentor",
      role: UserRole.Mentor,
    });

    const response = await GET();

    expect(response.status).toBe(401);
    expect(fetchInviteCode).not.toHaveBeenCalled();
  });

  it("GET loads the invite code with the session user and organization", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(founderSession());
    vi.mocked(fetchInviteCode).mockResolvedValue({
      data: { organizationId: "org-1", inviteCode: "ABCD2345" },
      headers: {},
      status: 200,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(fetchInviteCode).toHaveBeenCalledWith("org-1", "founder-1");
  });

  it("POST regenerates using the cookie identity, not a client-supplied actorId", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(founderSession());
    vi.mocked(regenerateInviteCode).mockResolvedValue({
      data: { organizationId: "org-1", inviteCode: "NEWCODE8" },
      headers: {},
      status: 200,
    });

    const response = await POST();

    expect(response.status).toBe(200);
    expect(regenerateInviteCode).toHaveBeenCalledWith("org-1", "founder-1");
  });
});
