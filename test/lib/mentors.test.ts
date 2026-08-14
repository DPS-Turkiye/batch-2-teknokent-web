import { beforeEach, describe, expect, it, vi } from "vitest";

import { getBackendUrl } from "@/lib/const";
import { httpClient } from "@/lib/http-client";
import {
  fetchMentors,
  isMentorProfile,
  loadMentors,
  MentorFetchError,
} from "@/lib/mentors";
import { createMentorResponse, mentorProfile } from "@test/fixtures/mentors";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
  },
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
    vi.mocked(httpClient.get).mockResolvedValue(
      createMentorResponse([mentorProfile]),
    );

    await expect(fetchMentors()).resolves.toEqual([mentorProfile]);
    expect(httpClient.get).toHaveBeenCalledWith(
      `${getBackendUrl()}/api/mentors`,
      expect.objectContaining({
        auth: expect.objectContaining({
          username: expect.any(String),
          password: expect.any(String),
        }),
      }),
    );
  });

  it("rejects non-successful responses", async () => {
    vi.mocked(httpClient.get).mockResolvedValue(
      createMentorResponse({ message: "Unauthorized" }, 401),
    );

    await expect(fetchMentors()).rejects.toMatchObject({
      name: "MentorFetchError",
      message: "Mentor API returned HTTP 401",
    });
  });

  it("rejects invalid response shapes", async () => {
    vi.mocked(httpClient.get).mockResolvedValue(
      createMentorResponse([{ fullName: "Incomplete" }]),
    );

    await expect(fetchMentors()).rejects.toBeInstanceOf(MentorFetchError);
  });

  it("returns a renderable error result when the backend is unavailable", async () => {
    vi.mocked(httpClient.get).mockRejectedValue(new Error("network down"));

    await expect(loadMentors()).resolves.toEqual({
      mentors: [],
      error: "Mentor API request failed",
    });
  });
});
