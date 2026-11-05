import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchMentors,
  isMentorProfile,
  loadMentors,
  MentorFetchError,
} from "@/lib/mentors";
import { getSessionIds } from "@/lib/session";
import { backendRequest } from "@/lib/server/backend-client";
import { createMentorResponse, mentorProfile } from "@test/fixtures/mentors";

vi.mock("@/lib/session", () => ({
  getSessionIds: vi
    .fn()
    .mockResolvedValue({ userId: "mentee-1", organizationId: "org-1" }),
}));

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
      params: { actorId: "mentee-1" },
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

it("never loads an unscoped fallback without a session", async () => {
  vi.mocked(backendRequest).mockClear();
  vi.mocked(getSessionIds).mockRejectedValueOnce(new Error("No session"));
  const result = await loadMentors();
  expect(result.mentors).toEqual([]);
  expect(backendRequest).not.toHaveBeenCalled();
});
