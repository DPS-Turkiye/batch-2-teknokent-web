import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/mentors/[id]/rating/route";
import { fetchMentorRating } from "@/lib/api/mentors";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/mentors", () => ({ fetchMentorRating: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSessionIds: vi.fn() }));

const params = { params: Promise.resolve({ id: "mentor-1" }) };

describe("mentor rating route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchMentorRating).mockResolvedValue({
      data: {},
      headers: {},
      status: 200,
    } as never);
  });

  it("reads a mentor's rating for a signed-in user", async () => {
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "mentee-1",
      organizationId: "",
    });

    expect((await GET(new Request("http://localhost"), params)).status).toBe(
      200,
    );
    expect(fetchMentorRating).toHaveBeenCalledWith("mentor-1");
  });

  it("needs a session", async () => {
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "",
      organizationId: "",
    });

    expect((await GET(new Request("http://localhost"), params)).status).toBe(
      401,
    );
    expect(fetchMentorRating).not.toHaveBeenCalled();
  });
});
