import { describe, expect, it } from "vitest";

import {
  approvedCoordinatorsOf,
  coordinatorsOf,
  daysSince,
  mentorsOf,
  needsAttention,
  pendingMemberships,
  pendingMentors,
  programForOrganization,
  programsForCoordinator,
  programsForMentor,
  startupsOf,
} from "@/components/admin/admin-model";
import type {
  AdminMentorMembership,
  AdminOverview,
  AdminUser,
} from "@/interfaces/admin-overview";
import { ProgramMentorStatus } from "@/interfaces/program";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import {
  adminMentorship,
  adminProgram,
  adminStartup,
} from "@test/fixtures/admin-programs";

function adminUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: "user-1",
    email: "user@menton.test",
    fullName: "Ada Yılmaz",
    role: UserRole.Mentor,
    status: UserAccountStatus.Approved,
    organizationId: null,
    organizationName: null,
    jobTitle: null,
    ...overrides,
  };
}

function membership(
  mentorId: string,
  status: ProgramMentorStatus,
): AdminMentorMembership {
  return {
    mentorId,
    fullName: `Mentor ${mentorId}`,
    email: `${mentorId}@menton.test`,
    status,
  };
}

function overview(overrides: Partial<AdminOverview> = {}): AdminOverview {
  return {
    programs: [],
    users: [],
    mentorships: [],
    requests: [],
    bottlenecks: [],
    meetingsLast8Weeks: 0,
    ...overrides,
  };
}

describe("admin-model people", () => {
  const users = [
    adminUser({ id: "coord-ok", role: UserRole.Coordinator }),
    adminUser({
      id: "coord-waiting",
      role: UserRole.Coordinator,
      status: UserAccountStatus.Pending,
    }),
    adminUser({ id: "mentor-ok" }),
    adminUser({ id: "mentor-waiting", status: UserAccountStatus.Pending }),
    adminUser({
      id: "mentor-rejected",
      status: UserAccountStatus.Rejected,
    }),
    adminUser({ id: "mentee", role: UserRole.Mentee }),
  ];
  const data = overview({ users });
  const ids = (list: AdminUser[]) => list.map((user) => user.id);

  it("lists coordinators whatever their status, and the approved ones apart", () => {
    expect(ids(coordinatorsOf(data))).toEqual(["coord-ok", "coord-waiting"]);
    expect(ids(approvedCoordinatorsOf(data))).toEqual(["coord-ok"]);
  });

  it("lists mentors, and only the pending ones as waiting for approval", () => {
    expect(ids(mentorsOf(data))).toEqual([
      "mentor-ok",
      "mentor-waiting",
      "mentor-rejected",
    ]);
    expect(ids(pendingMentors(data))).toEqual(["mentor-waiting"]);
  });
});

describe("pendingMemberships", () => {
  it("lists every program's waiting mentors with the program's name", () => {
    const data = overview({
      programs: [
        adminProgram({
          id: "p-1",
          name: "Stars",
          mentors: [
            membership("m-1", ProgramMentorStatus.Pending),
            membership("m-2", ProgramMentorStatus.Accepted),
          ],
        }),
        adminProgram({
          id: "p-2",
          name: "Growth",
          mentors: [membership("m-1", ProgramMentorStatus.Pending)],
        }),
      ],
    });

    expect(
      pendingMemberships(data).map(({ mentorId, programName }) => [
        mentorId,
        programName,
      ]),
    ).toEqual([
      ["m-1", "Stars"],
      ["m-1", "Growth"],
    ]);
  });

  it("is empty when no one is waiting", () => {
    expect(pendingMemberships(overview())).toEqual([]);
  });
});

describe("startupsOf", () => {
  it("lists a team once per program, even if a program lists it twice", () => {
    const inStars = adminStartup({ programId: "p-1" });
    const inGrowth = adminStartup({ programId: "p-2" });
    const data = overview({
      programs: [
        adminProgram({ id: "p-1", startups: [inStars, inStars] }),
        adminProgram({ id: "p-2", startups: [inGrowth] }),
      ],
    });

    expect(startupsOf(data)).toEqual([inStars, inGrowth]);
  });
});

describe("daysSince", () => {
  const now = new Date("2026-11-11T09:00:00");

  it("counts whole days from local midnight of the start date", () => {
    expect(daysSince("2026-11-11", now)).toBe(0);
    expect(daysSince("2026-11-10", now)).toBe(1);
    expect(daysSince("2026-10-28", now)).toBe(14);
  });

  it("is negative for a start date still ahead", () => {
    expect(daysSince("2026-11-13", now)).toBe(-2);
  });
});

describe("needsAttention", () => {
  const now = new Date("2026-11-11T09:00:00");

  it.each([
    ["PAUSED", 30],
    ["COMPLETED", 30],
    ["PLANNED", 30],
  ] as const)(
    "never flags a %s mentorship, however long ago it met",
    (status, days) => {
      expect(
        needsAttention(
          adminMentorship({ status, daysSinceMeeting: days }),
          now,
        ),
      ).toBe(false);
    },
  );

  it("flags an active mentorship from 14 days without a meeting", () => {
    expect(needsAttention(adminMentorship({ daysSinceMeeting: 13 }), now)).toBe(
      false,
    );
    expect(needsAttention(adminMentorship({ daysSinceMeeting: 14 }), now)).toBe(
      true,
    );
  });

  it("counts from the start date for an active mentorship that never met", () => {
    expect(
      needsAttention(
        adminMentorship({ daysSinceMeeting: null, startDate: "2026-10-29" }),
        now,
      ),
    ).toBe(false);
    expect(
      needsAttention(
        adminMentorship({ daysSinceMeeting: null, startDate: "2026-10-28" }),
        now,
      ),
    ).toBe(true);
  });
});

describe("program lookups", () => {
  const stars = adminProgram({
    id: "p-1",
    coordinatorId: "coord-1",
    startups: [adminStartup({ id: "org-1", programId: "p-1" })],
    mentors: [membership("m-1", ProgramMentorStatus.Pending)],
  });
  const growth = adminProgram({
    id: "p-2",
    coordinatorId: "coord-2",
    startups: [adminStartup({ id: "org-2", programId: "p-2" })],
    mentors: [membership("m-1", ProgramMentorStatus.Accepted)],
  });
  const data = overview({ programs: [stars, growth] });

  it("lists the programs a coordinator runs", () => {
    expect(programsForCoordinator(data, "coord-2")).toEqual([growth]);
    expect(programsForCoordinator(data, "nobody")).toEqual([]);
  });

  it("finds the program a startup is in, or none", () => {
    expect(programForOrganization(data, "org-2")).toBe(growth);
    expect(programForOrganization(data, "org-9")).toBeUndefined();
  });

  it("lists every program a mentor is in, invited or accepted", () => {
    expect(programsForMentor(data, "m-1")).toEqual([stars, growth]);
    expect(programsForMentor(data, "m-2")).toEqual([]);
  });
});
