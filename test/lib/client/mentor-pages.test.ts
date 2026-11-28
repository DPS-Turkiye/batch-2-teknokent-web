import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramStatus } from "@/interfaces/program";
import { backendHttp } from "@/lib/client/backend-http";
import {
  fetchMentors,
  loadMentorPage,
  loadMentorSlots,
} from "@/lib/client/mentor-pages";
import { MentorFetchError } from "@/lib/mentors";
import { createMentorResponse, mentorProfile } from "@test/fixtures/mentors";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

describe("the mentor directory, straight from the backend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asks for the mentors the caller may reach, naming nobody", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue(
      createMentorResponse([mentorProfile]),
    );

    await expect(fetchMentors()).resolves.toEqual([mentorProfile]);
    expect(backendHttp.get).toHaveBeenCalledWith("/api/mentors");
  });

  it("rejects non-successful responses", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue(
      createMentorResponse({ message: "Unauthorized" }, 401),
    );

    await expect(fetchMentors()).rejects.toMatchObject({
      name: "MentorFetchError",
      message: "Mentor API returned HTTP 401",
    });
  });

  it("rejects invalid response shapes", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue(
      createMentorResponse([{ fullName: "Incomplete" }]),
    );

    await expect(fetchMentors()).rejects.toBeInstanceOf(MentorFetchError);
  });

  it("wraps a network failure", async () => {
    vi.mocked(backendHttp.get).mockRejectedValue(new Error("network down"));

    await expect(fetchMentors()).rejects.toMatchObject({
      message: "Mentor API request failed",
    });
  });
});

describe("loadMentorSlots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps only well-formed open times", async () => {
    const slot = {
      id: "s-1",
      startsAt: "2099-01-05T10:00:00Z",
      durationMinutes: 30,
      booked: false,
    };
    vi.mocked(backendHttp.get).mockResolvedValue(
      createMentorResponse([slot, { id: "broken" }]),
    );

    await expect(loadMentorSlots("m/1")).resolves.toEqual([slot]);
    expect(backendHttp.get).toHaveBeenCalledWith(
      "/api/mentors/m%2F1/availability",
    );
  });

  it("answers none when the times cannot be read", async () => {
    vi.mocked(backendHttp.get).mockResolvedValueOnce(
      createMentorResponse(null, 404),
    );
    await expect(loadMentorSlots("m-1")).resolves.toEqual([]);

    vi.mocked(backendHttp.get).mockRejectedValueOnce(new Error("down"));
    await expect(loadMentorSlots("m-1")).resolves.toEqual([]);
  });
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
    vi.mocked(backendHttp.get).mockImplementation(async (url: string) =>
      url in routes
        ? createMentorResponse(routes[url])
        : createMentorResponse(null, 404),
    );
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
    // The backend reads the viewer's programs from the session; nothing names them.
    expect(backendHttp.get).toHaveBeenCalledWith("/api/programs/mine");
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
