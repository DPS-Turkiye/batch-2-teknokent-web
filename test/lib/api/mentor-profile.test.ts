import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchMentorAvailability,
  fetchMentorProfile,
} from "@/lib/api/mentor-profile";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

const MENTOR_URL = "/api/mentors/mentor%2F1";

describe("mentor profile server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it("reads the mentor's profile at its encoded path", async () => {
    await fetchMentorProfile("mentor/1");
    expect(backendRequest).toHaveBeenCalledWith({
      method: "GET",
      url: MENTOR_URL,
    });
  });

  it("lists the mentor's one-off availability slots", async () => {
    await fetchMentorAvailability("mentor/1");
    expect(backendRequest).toHaveBeenCalledWith({
      method: "GET",
      url: `${MENTOR_URL}/availability`,
    });
  });
});
