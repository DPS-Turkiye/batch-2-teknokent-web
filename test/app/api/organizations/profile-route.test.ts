import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PUT } from "@/app/api/organizations/profile/route";
import { fetchOrganization, updateOrganization } from "@/lib/api/organization";
import { UserRole, type AppSession } from "@/interfaces/session";
import { getSessionUser } from "@/lib/session";

vi.mock("@/lib/api/organization", () => ({
  fetchOrganization: vi.fn(),
  updateOrganization: vi.fn(),
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

function profile() {
  return {
    id: "org-1",
    name: "GreenLoop",
    description: "Atık akışı platformu",
    website: "greenloop.co",
    problem: null,
    solution: null,
    currentSolution: null,
    targetUser: null,
    sector: "ClimateTech",
    maturity: "Pilot",
    programLevel: null,
    supportAreas: ["Finans"],
    createdAt: "2026-09-01T12:00:00Z",
    updatedAt: "2026-09-03T09:00:00Z",
  };
}

describe("/api/organizations/profile", () => {
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
    expect(fetchOrganization).not.toHaveBeenCalled();
  });

  it("GET loads the startup profile for the session organization", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(founderSession());
    vi.mocked(fetchOrganization).mockResolvedValue({
      data: profile(),
      status: 200,
    } as Awaited<ReturnType<typeof fetchOrganization>>);

    const response = await GET();

    expect(fetchOrganization).toHaveBeenCalledWith("org-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ name: "GreenLoop" });
  });

  it("PUT rejects a session without an organization", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await PUT(
      new Request("http://localhost/api/organizations/profile", {
        method: "PUT",
        body: JSON.stringify({ name: "GreenLoop" }),
      }),
    );

    expect(response.status).toBe(401);
    expect(updateOrganization).not.toHaveBeenCalled();
  });

  // The backend authorizes on actorId, so the route must send the session user
  // rather than trusting anything in the request body.
  it("PUT forwards the session user as the actor", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(founderSession());
    vi.mocked(updateOrganization).mockResolvedValue({
      data: profile(),
      status: 200,
    } as Awaited<ReturnType<typeof updateOrganization>>);

    const response = await PUT(
      new Request("http://localhost/api/organizations/profile", {
        method: "PUT",
        body: JSON.stringify({ name: "GreenLoop", supportAreas: ["Finans"] }),
      }),
    );

    expect(updateOrganization).toHaveBeenCalledWith(
      "org-1",
      "founder-1",
      expect.objectContaining({ name: "GreenLoop" }),
    );
    expect(response.status).toBe(200);
  });
});
