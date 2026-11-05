import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/mentors/route";
import { fetchMentorDirectory } from "@/lib/api/mentors";
import { getSessionIds } from "@/lib/session";
import { SessionRequiredError } from "@/lib/server/session-error";

vi.mock("@/lib/api/mentors", () => ({
  fetchMentorDirectory: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
}));

describe("GET /api/mentors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchMentorDirectory).mockResolvedValue({
      data: [{ id: "mentor-1", fullName: "Leyla Aksoy" }],
      headers: {},
      status: 200,
    });
  });

  it("requires a session before listing mentors", async () => {
    vi.mocked(getSessionIds).mockRejectedValue(new SessionRequiredError());

    const response = await GET();

    expect(response.status).toBe(401);
    expect(fetchMentorDirectory).not.toHaveBeenCalled();
  });

  it("proxies the mentors the signed-in mentee can reach", async () => {
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "mentee-1",
      organizationId: "org-1",
    });

    const response = await GET();

    expect(fetchMentorDirectory).toHaveBeenCalledWith("mentee-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      { id: "mentor-1", fullName: "Leyla Aksoy" },
    ]);
  });
});
