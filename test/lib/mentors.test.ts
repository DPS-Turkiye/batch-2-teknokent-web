import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchMentors,
  isMentorProfile,
  loadMentors,
  MentorFetchError,
} from "@/lib/mentors";
import { backendRequest } from "@/lib/server/backend-client";
import { createMentorResponse, mentorProfile } from "@test/fixtures/mentors";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

describe("mentor data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates a complete mentor profile", () => {
    expect(isMentorProfile(mentorProfile)).toBe(true);
    expect(isMentorProfile({ ...mentorProfile, specialties: null })).toBe(
      false,
    );
  });

  it("fetches mentor profiles with server-side Basic Auth", async () => {
    vi.mocked(backendRequest).mockResolvedValue(
      createMentorResponse([mentorProfile]),
    );

    await expect(fetchMentors()).resolves.toEqual([mentorProfile]);
    expect(backendRequest).toHaveBeenCalledWith({
      method: "GET",
      url: "/api/mentors",
    });
  });

  it("rejects non-successful responses", async () => {
    vi.mocked(backendRequest).mockResolvedValue(
      createMentorResponse({ message: "Unauthorized" }, 401),
    );

    await expect(fetchMentors()).rejects.toMatchObject({
      name: "MentorFetchError",
      message: "Mentor API returned HTTP 401",
    });
  });

  it("rejects invalid response shapes", async () => {
    vi.mocked(backendRequest).mockResolvedValue(
      createMentorResponse([{ fullName: "Incomplete" }]),
    );

    await expect(fetchMentors()).rejects.toBeInstanceOf(MentorFetchError);
  });

  it("returns a renderable error result when the backend is unavailable", async () => {
    vi.mocked(backendRequest).mockRejectedValue(new Error("network down"));

    await expect(loadMentors()).resolves.toEqual({
      mentors: [],
      error: "Mentor API request failed",
    });
  });
});
