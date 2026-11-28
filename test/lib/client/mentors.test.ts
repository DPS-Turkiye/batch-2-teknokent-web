import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import { getMentors } from "@/lib/client/mentors";
import { mentorProfile } from "@test/fixtures/mentors";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

describe("getMentors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads the approved mentor directory from the BFF", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue({
      status: 200,
      data: [mentorProfile],
    });

    await expect(getMentors()).resolves.toEqual([mentorProfile]);
    expect(backendHttp.get).toHaveBeenCalledWith("/api/mentors");
  });
});
