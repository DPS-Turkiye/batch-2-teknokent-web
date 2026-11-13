import { describe, expect, it } from "vitest";

import type {
  AdminMentorship,
  AdminOverview,
  AdminProgram,
  AdminStartup,
} from "@/interfaces/admin-overview";
import { MentorshipStatus } from "@/interfaces/coordinator-mentorship";
import {
  ProgramMentorStatus,
  ProgramStatus,
  ProgramType,
} from "@/interfaces/program";
import {
  activeMentorshipFor,
  assignableProgramsForMentor,
  coordinatorUsersHref,
  countsInProgram,
  mentorshipInPrograms,
  moveTargetsForStartup,
  programOfMentorship,
  unmatchedStartups,
} from "@/lib/admin-model";
import {
  adminMentorship,
  adminProgram,
  adminStartup,
} from "@test/fixtures/admin-programs";

/** A program holding just the given team. */
function programOf(team: AdminStartup): AdminProgram {
  return adminProgram({
    id: team.programId,
    name: team.programName,
    startupCount: 1,
    startups: [team],
  });
}

function lumenIn(programId: string, programName: string): AdminStartup {
  return adminStartup({ programId, programName });
}

function mentorship(
  id: string,
  programId: string | null | undefined,
): AdminMentorship {
  const made = adminMentorship({
    id,
    mentorId: `mentor-${id}`,
    mentorName: `Mentor ${id}`,
    daysSinceMeeting: 3,
  });
  return programId === undefined ? made : { ...made, programId };
}

const lumenInStars = lumenIn("program-1", "ODTÜ Stars 2026");
const lumenInGrowth = lumenIn("program-2", "Growth Circuit 2026");
const stars = programOf(lumenInStars);
const growth = programOf(lumenInGrowth);

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

describe("admin-model programs the admin can still assign to", () => {
  const closed: AdminProgram = {
    ...programOf(lumenIn("program-3", "Kapanan Program")),
    status: ProgramStatus.Completed,
  };
  const withMentors: AdminProgram = {
    ...growth,
    mentors: [
      {
        mentorId: "mentor-a",
        fullName: "A",
        email: "a@test.co",
        status: ProgramMentorStatus.Accepted,
      },
      {
        mentorId: "mentor-b",
        fullName: "B",
        email: "b@test.co",
        status: ProgramMentorStatus.Pending,
      },
    ],
  };
  const data: AdminOverview = {
    ...overview([]),
    programs: [stars, withMentors, closed],
  };

  it("offers open programs a mentor is not in, or only waiting for", () => {
    expect(
      assignableProgramsForMentor(data, "mentor-a").map((item) => item.id),
    ).toEqual(["program-1"]);
    expect(
      assignableProgramsForMentor(data, "mentor-b").map((item) => item.id),
    ).toEqual(["program-1", "program-2"]);
  });

  it("offers every other open startup program as a team's move target", () => {
    const peer: AdminProgram = {
      ...programOf(lumenIn("program-4", "Akran Programı")),
      type: ProgramType.PeerMentoring,
    };
    const all = { ...data, programs: [stars, withMentors, closed, peer] };

    expect(
      moveTargetsForStartup(all, lumenInStars).map((item) => item.id),
    ).toEqual(["program-2"]);
    // A team listed in both programs can still be moved into the other one.
    expect(
      moveTargetsForStartup(all, lumenInGrowth).map((item) => item.id),
    ).toEqual(["program-1"]);
  });
});

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

    expect(activeMentorshipFor(data, lumenInStars)?.id).toBe("m-1");
    expect(activeMentorshipFor(data, lumenInGrowth)).toBeUndefined();
    expect(unmatchedStartups(data).map((startup) => startup.programId)).toEqual(
      ["program-2"],
    );
  });

  it("names the program a mentorship was made in, not the team's first program", () => {
    const item = mentorship("m-2", "program-2");
    const data = overview([item]);

    expect(programOfMentorship(data, item)?.name).toBe("Growth Circuit 2026");
  });

  it("falls back to the team's program for an older mentorship", () => {
    const item = mentorship("m-old", null);
    const data = overview([item]);

    expect(programOfMentorship(data, item)?.name).toBe("ODTÜ Stars 2026");
  });
});

describe("admin-model current mentorship", () => {
  it.each([
    [MentorshipStatus.Active, "m-1"],
    [MentorshipStatus.Planned, "m-1"],
    [MentorshipStatus.Paused, undefined],
    [MentorshipStatus.Completed, undefined],
  ])("treats a %s mentorship as the team's match: %s", (status, id) => {
    const data = overview([{ ...mentorship("m-1", "program-1"), status }]);

    expect(activeMentorshipFor(data, lumenInStars)?.id).toBe(id);
  });
});

describe("admin-model coordinator link", () => {
  it("opens the user list on the program's coordinator, or the whole list", () => {
    expect(coordinatorUsersHref({ coordinatorId: "coord 1" })).toBe(
      "/admin/users?user=coord%201",
    );
    expect(coordinatorUsersHref({ coordinatorId: null })).toBe("/admin/users");
    expect(coordinatorUsersHref(undefined)).toBe("/admin/users");
  });
});
