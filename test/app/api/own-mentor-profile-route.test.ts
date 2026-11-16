import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getAvailability } from "@/app/api/mentor-profile/availability/route";
import { GET as getProfile } from "@/app/api/mentor-profile/route";
import {
  fetchOwnMentorAvailability,
  fetchOwnMentorProfile,
} from "@/lib/api/mentor-profile";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/mentor-profile", () => ({
  createMentorAvailabilitySlot: vi.fn(),
  fetchOwnMentorAvailability: vi.fn(),
  fetchOwnMentorProfile: vi.fn(),
  updateMentorProfile: vi.fn(),
}));
vi.mock("@/lib/api/auth", () => ({ fetchSignedInUser: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSessionIds: vi.fn() }));

describe("a mentor's own profile routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "mentor-1",
      organizationId: "",
    });
    const ok = { data: {}, headers: {}, status: 200 };
    vi.mocked(fetchOwnMentorProfile).mockResolvedValue(ok);
    vi.mocked(fetchOwnMentorAvailability).mockResolvedValue(ok);
  });

  it("reads the profile as the session's mentor, never an id from the request", async () => {
    expect((await getProfile()).status).toBe(200);
    expect(fetchOwnMentorProfile).toHaveBeenCalledWith("mentor-1");
  });

  it("reads the slots as the session's mentor", async () => {
    expect((await getAvailability()).status).toBe(200);
    expect(fetchOwnMentorAvailability).toHaveBeenCalledWith("mentor-1");
  });
});
