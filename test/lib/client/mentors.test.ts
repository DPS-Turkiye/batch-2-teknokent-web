import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createMentorAvailabilitySlot,
  deleteMentorAvailabilitySlot,
  getOwnMentorAvailability,
} from "@/lib/client/mentors";
import { httpClient } from "@/lib/http-client";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

function ok<T>(data: T) {
  return { data, status: 200, headers: {}, statusText: "OK", config: {} };
}

describe("mentors client API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists a mentor's own availability", async () => {
    vi.mocked(httpClient.get).mockResolvedValue(ok([]));
    await getOwnMentorAvailability("mentor-1");
    expect(httpClient.get).toHaveBeenCalledWith(
      "/api/mentors/mentor-1/availability",
    );
  });

  it("creates a slot with the optional duration", async () => {
    vi.mocked(httpClient.post).mockResolvedValue(
      ok({
        id: "slot-1",
        startsAt: "2026-08-21T10:00:00.000Z",
        durationMinutes: 60,
      }),
    );

    await createMentorAvailabilitySlot({
      mentorId: "mentor-1",
      startsAt: "2026-08-21T10:00:00.000Z",
      durationMinutes: 60,
    });

    expect(httpClient.post).toHaveBeenCalledWith(
      "/api/mentors/mentor-1/availability",
      { startsAt: "2026-08-21T10:00:00.000Z", durationMinutes: 60 },
    );
  });

  it("deletes a slot", async () => {
    vi.mocked(httpClient.delete).mockResolvedValue(ok(undefined));
    await deleteMentorAvailabilitySlot({
      mentorId: "mentor-1",
      slotId: "slot-1",
    });
    expect(httpClient.delete).toHaveBeenCalledWith(
      "/api/mentors/mentor-1/availability/slot-1",
    );
  });

  it("throws when the request fails", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: { message: "boom" },
      status: 500,
      headers: {},
      statusText: "Error",
      config: {},
    });

    await expect(getOwnMentorAvailability("mentor-1")).rejects.toThrow("boom");
  });
});
