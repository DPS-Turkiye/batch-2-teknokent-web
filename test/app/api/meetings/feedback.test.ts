import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/meetings/feedback/route";
import { fetchRatedMeetingIds } from "@/lib/api/meetings";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/meetings", () => ({
  fetchRatedMeetingIds: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
}));

describe("GET /api/meetings/feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "mentee-1",
      organizationId: "org-1",
    } as Awaited<ReturnType<typeof getSessionIds>>);
    vi.mocked(fetchRatedMeetingIds).mockResolvedValue({
      data: ["m-1"],
      headers: {},
      status: 200,
    } as Awaited<ReturnType<typeof fetchRatedMeetingIds>>);
  });

  it("asks the backend once, as the signed-in user, for every meeting id", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/meetings/feedback?meetingIds=m-1,m-2",
      ),
    );

    expect(fetchRatedMeetingIds).toHaveBeenCalledWith(
      ["m-1", "m-2"],
      "mentee-1",
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(["m-1"]);
  });
});
