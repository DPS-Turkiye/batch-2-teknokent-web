import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMentors } from "@/lib/client/mentors";
import { httpClient } from "@/lib/http-client";
import { mentorProfile } from "@test/fixtures/mentors";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
  },
}));

describe("getMentors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads the approved mentor directory from the BFF", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      status: 200,
      data: [mentorProfile],
    } as never);

    await expect(getMentors()).resolves.toEqual([mentorProfile]);
    expect(httpClient.get).toHaveBeenCalledWith("/api/mentors");
  });
});
