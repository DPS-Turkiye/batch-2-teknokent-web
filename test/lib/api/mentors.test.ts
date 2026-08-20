import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createMentorAvailability,
  deleteMentorAvailability,
  fetchMentorAvailability,
} from "@/lib/api/mentors";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

describe("mentor availability server API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches a mentor's availability", async () => {
    await fetchMentorAvailability("mentor-1");
    expect(backendRequest).toHaveBeenCalledWith({
      method: HttpMethod.Get,
      url: "/api/mentors/mentor-1/availability",
    });
  });

  it("creates an availability slot", async () => {
    await createMentorAvailability("mentor-1", {
      startsAt: "2026-08-21T10:00:00.000Z",
      durationMinutes: 60,
    });
    expect(backendRequest).toHaveBeenCalledWith({
      method: HttpMethod.Post,
      url: "/api/mentors/mentor-1/availability",
      data: { startsAt: "2026-08-21T10:00:00.000Z", durationMinutes: 60 },
    });
  });

  it("deletes an availability slot", async () => {
    await deleteMentorAvailability("mentor-1", "slot-1");
    expect(backendRequest).toHaveBeenCalledWith({
      method: HttpMethod.Delete,
      url: "/api/mentors/mentor-1/availability/slot-1",
    });
  });

  it("encodes ids in the URL", async () => {
    await fetchMentorAvailability("mentor with space");
    expect(backendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/api/mentors/mentor%20with%20space/availability",
      }),
    );
  });
});
