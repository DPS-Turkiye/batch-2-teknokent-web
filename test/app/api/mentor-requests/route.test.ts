import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/mentor-requests/route";
import { UserRole } from "@/interfaces/session";
import { fetchMentorRequests } from "@/lib/api/mentor-requests";
import { getSessionIds, getSessionMentorId } from "@/lib/session";

vi.mock("@/lib/api/mentor-requests", () => ({
  fetchMentorRequests: vi.fn(),
  createMentorRequest: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
  getSessionMentorId: vi.fn(),
}));

describe("GET /api/mentor-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchMentorRequests).mockResolvedValue({
      data: [],
      headers: {},
      status: 200,
    });
  });

  it("resolves the mentor id from the session for role=mentor", async () => {
    vi.mocked(getSessionMentorId).mockResolvedValue("mentor-1");

    await GET(new NextRequest(`http://localhost/x?role=${UserRole.Mentor}`));

    expect(getSessionMentorId).toHaveBeenCalled();
    expect(getSessionIds).not.toHaveBeenCalled();
    expect(fetchMentorRequests).toHaveBeenCalledWith({
      actorId: "mentor-1",
      requesterId: "mentor-1",
      role: UserRole.Mentor,
    });
  });

  it("resolves the startup id from the session for the default role", async () => {
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "mentee-1",
      organizationId: "org-1",
    });

    await GET(new NextRequest("http://localhost/x"));

    expect(getSessionIds).toHaveBeenCalled();
    expect(getSessionMentorId).not.toHaveBeenCalled();
    expect(fetchMentorRequests).toHaveBeenCalledWith({
      actorId: "mentee-1",
      organizationId: "org-1",
      role: UserRole.Mentee,
    });
  });
});
