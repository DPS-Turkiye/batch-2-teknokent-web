import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramStatus } from "@/interfaces/program";
import {
  fetchMentors,
  isMentorProfile,
  loadMentorPage,
  loadMentors,
  MentorFetchError,
} from "@/lib/mentors";
import { backendRequest } from "@/lib/server/backend-client";
import { getSessionIds } from "@/lib/session";
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

describe("loadMentorPage", () => {
  const otherProgramMentor = {
    ...mentorProfile,
    id: "mentor-sude",
    programs: [
      {
        id: "p-sude",
        name: "Sude Hızlandırma",
        status: ProgramStatus.Active,
        role: null,
      },
    ],
  };

  function backend(routes: Record<string, unknown>) {
    vi.mocked(backendRequest).mockImplementation(async (config) => {
      const url = String(config.url);
      if (!(url in routes)) return createMentorResponse(null, 404);
      return createMentorResponse(routes[url]);
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lets the viewer ask a mentor of their active program", async () => {
    backend({ "/api/mentors": [mentorProfile] });

    await expect(loadMentorPage(mentorProfile.id)).resolves.toEqual({
      mentor: mentorProfile,
      viewOnlyPrograms: null,
    });
  });

  it("shows a mentor of another of the viewer's programs, view-only", async () => {
    backend({
      "/api/mentors": [mentorProfile],
      "/api/mentors/mentor-sude": otherProgramMentor,
      "/api/programs/mine": {
        programs: [{ id: "p-sude", name: "Sude Hızlandırma" }],
        activeProgramId: "p-active",
      },
    });

    await expect(loadMentorPage("mentor-sude")).resolves.toEqual({
      mentor: otherProgramMentor,
      viewOnlyPrograms: ["Sude Hızlandırma"],
    });
    expect(backendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/api/programs/mine",
        params: { actorId: "mentee-1" },
      }),
    );
  });

  it("shows nothing for a mentor outside the viewer's programs", async () => {
    backend({
      "/api/mentors": [mentorProfile],
      "/api/mentors/mentor-sude": otherProgramMentor,
      "/api/programs/mine": { programs: [], activeProgramId: null },
    });

    await expect(loadMentorPage("mentor-sude")).resolves.toBeNull();
  });

  it("shows nothing when the mentor cannot be loaded", async () => {
    backend({
      "/api/mentors": [mentorProfile],
      "/api/programs/mine": {
        programs: [{ id: "p-sude", name: "Sude Hızlandırma" }],
        activeProgramId: null,
      },
    });

    await expect(loadMentorPage("missing")).resolves.toBeNull();
  });
});
