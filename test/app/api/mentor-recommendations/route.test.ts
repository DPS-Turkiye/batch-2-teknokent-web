import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/mentor-recommendations/route";
import { recommendMentors } from "@/lib/api/mentor-recommendations";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/mentor-recommendations", () => ({
  recommendMentors: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
}));

describe("POST /api/mentor-recommendations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "mentee-1",
      organizationId: "org-1",
    });
    vi.mocked(recommendMentors).mockResolvedValue({
      data: [],
      headers: { "x-matching-method": "DETERMINISTIC" },
      status: 200,
    });
  });

  it("ranks for the signed-in mentee, so their program's mentors only", async () => {
    const payload = { supportArea: "Finans", summary: "Yatırım turu" };

    const response = await POST(
      new NextRequest("http://localhost/api/mentor-recommendations", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(200);
    expect(recommendMentors).toHaveBeenCalledWith(payload, "mentee-1");
  });
});
