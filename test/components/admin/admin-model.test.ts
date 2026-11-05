import { describe, expect, it } from "vitest";

import {
  activeMentorshipFor,
  countsInProgram,
  mentorshipInPrograms,
  programOfMentorship,
  unmatchedStartups,
} from "@/components/admin/admin-model";
import type {
  AdminMentorship,
  AdminOverview,
  AdminProgram,
} from "@/interfaces/admin-overview";

function program(id: string, name: string): AdminProgram {
  return {
    id,
    name,
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00Z",
    coordinatorId: null,
    coordinatorName: null,
    startupCount: 1,
    acceptedMentorCount: 0,
    pendingMentorCount: 0,
    startups: [
      {
        id: "org-1",
        name: "Lumen",
        sector: null,
        programId: id,
        programName: name,
      },
    ],
    mentors: [],
  };
}

function mentorship(
  id: string,
  programId: string | null | undefined,
): AdminMentorship {
  return {
    id,
    mentorId: `mentor-${id}`,
    mentorName: `Mentor ${id}`,
    organizationId: "org-1",
    organizationName: "Lumen",
    status: "ACTIVE",
    startDate: "2026-01-01",
    endDate: null,
    progressPercent: 0,
    daysSinceMeeting: 3,
    programId,
  };
}

const stars = program("program-1", "ODTÜ Stars 2026");
const growth = program("program-2", "Growth Circuit 2026");

function overview(mentorships: AdminMentorship[]): AdminOverview {
  return {
    programs: [stars, growth],
    users: [],
    mentorships,
    requests: [],
    bottlenecks: [],
    meetingsLast8Weeks: 0,
  };
}

describe("admin-model program attribution", () => {
  it("counts a mentorship only in the program it was made in", () => {
    const item = mentorship("m-1", "program-1");

    expect(countsInProgram(item, "program-1")).toBe(true);
    expect(countsInProgram(item, "program-2")).toBe(false);
    expect(mentorshipInPrograms(item, [stars])).toBe(true);
    expect(mentorshipInPrograms(item, [growth])).toBe(false);
  });

  it("counts an older mentorship without a program in each of its team's programs", () => {
    for (const programId of [null, undefined]) {
      const item = mentorship("m-old", programId);

      expect(mentorshipInPrograms(item, [stars])).toBe(true);
      expect(mentorshipInPrograms(item, [growth])).toBe(true);
    }
  });

  it("keeps a team matched in one program waiting in the other", () => {
    const data = overview([mentorship("m-1", "program-1")]);

    expect(activeMentorshipFor(data, stars.startups[0])?.id).toBe("m-1");
    expect(activeMentorshipFor(data, growth.startups[0])).toBeUndefined();
    expect(unmatchedStartups(data).map((startup) => startup.programId)).toEqual(
      ["program-2"],
    );
  });

  it("names the program a mentorship was made in, not the team's first program", () => {
    const data = overview([mentorship("m-2", "program-2")]);

    expect(programOfMentorship(data, data.mentorships[0])?.name).toBe(
      "Growth Circuit 2026",
    );
  });

  it("falls back to the team's program for an older mentorship", () => {
    const data = overview([mentorship("m-old", null)]);

    expect(programOfMentorship(data, data.mentorships[0])?.name).toBe(
      "ODTÜ Stars 2026",
    );
  });
});
