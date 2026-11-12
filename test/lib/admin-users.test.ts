import { describe, expect, it } from "vitest";

import {
  BottleneckSeverity,
  type AdminBottleneck,
  type AdminOverview,
  type AdminProgram,
  type AdminUser,
} from "@/interfaces/admin-overview";
import { MentorshipStatus } from "@/interfaces/coordinator-mentorship";
import { ProgramMentorStatus } from "@/interfaces/program";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import {
  coordinatorCounts,
  filterCoordinators,
  filterMentors,
  filterTeams,
  hasPendingInvite,
  hasStaleMentorship,
  isInvitePending,
  isRiskyTeam,
  isWaitingForMentor,
  liveMentorshipsOf,
  mentorCounts,
  mentorRow,
  ofOrganization,
  pageOf,
  pageRange,
  relativeTime,
  teamCounts,
  teamHealth,
  teamKey,
  teamRow,
  USERS_PAGE_SIZE,
  withoutClosedTabLinks,
} from "@/lib/admin-users";
import { TeamHealth, UserFilter, UserTab } from "@/types/admin-users";
import {
  adminMentorship,
  adminProgram,
  adminStartup,
} from "@test/fixtures/admin-programs";
import { translatorIn } from "@test/translators";

const t = translatorIn("tr", "adminUsers");

function adminUser(overrides: Partial<AdminUser>): AdminUser {
  return {
    id: "user-1",
    email: "user@tekno.co",
    fullName: "Kişi",
    role: UserRole.Coordinator,
    status: UserAccountStatus.Approved,
    organizationId: null,
    organizationName: null,
    jobTitle: null,
    ...overrides,
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

function bottleneck(organizationId: string): AdminBottleneck {
  return {
    id: `b-${organizationId}`,
    title: "Yatırım",
    severity: BottleneckSeverity.High,
    status: "OPEN",
    organizationId,
    organizationName: "Lumen",
    createdAt: "2026-11-01T00:00:00Z",
  };
}

const all = { filter: UserFilter.All, program: "", search: "" };

describe("admin users paging", () => {
  const rows = Array.from({ length: 9 }, (_, index) => index);

  it("cuts the rows into pages", () => {
    expect(pageOf(rows, 0)).toHaveLength(USERS_PAGE_SIZE);
    expect(pageOf(rows, 1)).toEqual([7, 8]);
    expect(pageOf(rows, 2)).toEqual([]);
  });

  it("counts pages and the range shown", () => {
    expect(pageRange(9, 0)).toEqual({ pages: 2, start: 1, end: 7 });
    expect(pageRange(9, 1)).toEqual({ pages: 2, start: 8, end: 9 });
    expect(pageRange(0, 0)).toEqual({ pages: 1, start: 0, end: 0 });
  });
});

describe("admin users coordinators", () => {
  const stars = adminProgram({ id: "p-1", name: "Stars", coordinatorId: "c1" });
  const ayla = adminUser({
    id: "c1",
    fullName: "Ayla Bekler",
    email: "ayla@tekno.co",
  });
  const burcu = adminUser({
    id: "c2",
    fullName: "Burcu Şen",
    email: "burcu@tekno.co",
    status: UserAccountStatus.Pending,
  });
  const cem = adminUser({
    id: "c3",
    fullName: "Cem İnce",
    email: "cem@tekno.co",
    status: UserAccountStatus.Rejected,
  });
  const users = [ayla, burcu, cem];
  const data = overview({ programs: [stars], users });

  it("counts each chip, with nobody counted as without access", () => {
    expect(coordinatorCounts(users)).toEqual({
      [UserFilter.All]: 3,
      [UserFilter.Active]: 1,
      [UserFilter.Pending]: 1,
      [UserFilter.NoAccess]: 0,
      [UserFilter.Inactive]: 1,
    });
  });

  it("keeps the accounts each chip names", () => {
    const by = (filter: UserFilter) =>
      filterCoordinators(data, users, { ...all, filter }).map(
        (user) => user.id,
      );
    expect(by(UserFilter.All)).toEqual(["c1", "c2", "c3"]);
    expect(by(UserFilter.Active)).toEqual(["c1"]);
    expect(by(UserFilter.Pending)).toEqual(["c2"]);
    expect(by(UserFilter.Inactive)).toEqual(["c3"]);
    expect(by(UserFilter.NoAccess)).toEqual([]);
  });

  it("narrows to a coordinated program and a Turkish-aware search", () => {
    expect(
      filterCoordinators(data, users, { ...all, program: "Stars" }).map(
        (user) => user.id,
      ),
    ).toEqual(["c1"]);
    expect(
      filterCoordinators(data, users, { ...all, search: "İNCE" }).map(
        (user) => user.id,
      ),
    ).toEqual(["c3"]);
    expect(
      filterCoordinators(data, users, { ...all, search: "burcu@" }).map(
        (user) => user.id,
      ),
    ).toEqual(["c2"]);
  });
});

describe("admin users mentors", () => {
  const invited = adminUser({
    id: "m1",
    role: UserRole.Mentor,
    fullName: "Deniz Ak",
    expertise: ["FINANCE"],
  });
  const accepted = adminUser({
    id: "m2",
    role: UserRole.Mentor,
    fullName: "Ece Su",
  });
  const pending = adminUser({
    id: "m3",
    role: UserRole.Mentor,
    fullName: "Ferit Çal",
    status: UserAccountStatus.Pending,
  });
  const program: AdminProgram = adminProgram({
    id: "p-1",
    name: "Stars",
    mentors: [
      {
        mentorId: "m1",
        fullName: "Deniz Ak",
        email: "d@x.co",
        status: ProgramMentorStatus.Pending,
      },
      {
        mentorId: "m2",
        fullName: "Ece Su",
        email: "e@x.co",
        status: ProgramMentorStatus.Accepted,
      },
      {
        mentorId: "m3",
        fullName: "Ferit Çal",
        email: "f@x.co",
        status: ProgramMentorStatus.Pending,
      },
    ],
  });
  const users = [invited, accepted, pending];
  const data = overview({
    programs: [program, adminProgram({ id: "p-2", name: "Boş" })],
    users,
    mentorships: [
      adminMentorship({ id: "a", mentorId: "m2", daysSinceMeeting: 20 }),
      adminMentorship({
        id: "b",
        mentorId: "m2",
        status: MentorshipStatus.Planned,
      }),
      adminMentorship({
        id: "c",
        mentorId: "m2",
        status: MentorshipStatus.Completed,
      }),
      adminMentorship({ id: "d", mentorId: "m1", daysSinceMeeting: 2 }),
    ],
  });

  it("sees a pending invitation only for an approved mentor", () => {
    expect(hasPendingInvite(invited, data.programs)).toBe(true);
    expect(hasPendingInvite(accepted, data.programs)).toBe(false);
    expect(hasPendingInvite(pending, data.programs)).toBe(false);
  });

  it("reads the mentor's own membership in a program", () => {
    expect(isInvitePending(program, "m1")).toBe(true);
    expect(isInvitePending(program, "m2")).toBe(false);
    expect(isInvitePending(program, "nobody")).toBe(false);
  });

  it("counts each chip", () => {
    expect(mentorCounts(data, users)).toEqual({
      [UserFilter.All]: 3,
      [UserFilter.Active]: 2,
      [UserFilter.Pending]: 1,
      [UserFilter.Invited]: 1,
      [UserFilter.Inactive]: 0,
    });
  });

  it("filters by chip, program and name, email or expertise", () => {
    const ids = (criteria: Partial<typeof all>) =>
      filterMentors(data, users, { ...all, ...criteria }).map(
        (user) => user.id,
      );
    expect(ids({})).toEqual(["m1", "m2", "m3"]);
    expect(ids({ filter: UserFilter.Active })).toEqual(["m1", "m2"]);
    expect(ids({ filter: UserFilter.Pending })).toEqual(["m3"]);
    expect(ids({ filter: UserFilter.Inactive })).toEqual([]);
    expect(ids({ filter: UserFilter.Invited })).toEqual(["m1"]);
    expect(ids({ program: "Boş" })).toEqual([]);
    expect(ids({ program: "Stars" })).toEqual(["m1", "m2", "m3"]);
    expect(ids({ search: "FINANCE" })).toEqual(["m1"]);
    expect(ids({ search: "ÇAL" })).toEqual(["m3"]);
  });

  it("loads a mentor with active and planned mentorships and flags a stale one", () => {
    const load = liveMentorshipsOf(data, "m2");
    expect(load.map((item) => item.id)).toEqual(["a", "b"]);
    expect(hasStaleMentorship(load)).toBe(true);
    expect(hasStaleMentorship(liveMentorshipsOf(data, "m1"))).toBe(false);
    expect(
      hasStaleMentorship([
        adminMentorship({
          status: MentorshipStatus.Planned,
          daysSinceMeeting: 30,
        }),
      ]),
    ).toBe(false);
  });

  it("builds a table row", () => {
    expect(mentorRow(data, invited)).toEqual({
      user: invited,
      programs: [program],
      mentorships: [data.mentorships[3]],
      stale: false,
      pendingInvite: true,
    });
    expect(mentorRow(data, accepted)).toMatchObject({
      stale: true,
      pendingInvite: false,
    });
  });
});

describe("admin users teams", () => {
  const healthy = adminStartup({
    id: "org-1",
    name: "Lumen",
    founderName: "Gül Ay",
  });
  const risky = adminStartup({ id: "org-2", name: "Nova" });
  const blocked = adminStartup({ id: "org-3", name: "Orbit" });
  const waiting = adminStartup({
    id: "org-4",
    name: "Zeta",
    programId: "program-2",
    programName: "Kuluçka",
  });
  const teams = [healthy, risky, blocked, waiting];
  const data = overview({
    users: [
      adminUser({ id: "u1", organizationId: "org-1" }),
      adminUser({ id: "u2", organizationId: "org-1" }),
      adminUser({ id: "u3", organizationId: null }),
    ],
    mentorships: [
      adminMentorship({
        id: "a",
        organizationId: "org-1",
        daysSinceMeeting: 1,
      }),
      adminMentorship({
        id: "b",
        organizationId: "org-2",
        daysSinceMeeting: 30,
      }),
      adminMentorship({
        id: "c",
        organizationId: "org-3",
        status: MentorshipStatus.Planned,
      }),
      adminMentorship({
        id: "d",
        organizationId: "org-4",
        status: MentorshipStatus.Cancelled,
      }),
    ],
    bottlenecks: [bottleneck("org-3")],
  });

  it("keys a team by program and team", () => {
    expect(teamKey(waiting)).toBe("program-2:org-4");
  });

  it("tells waiting and risky teams apart", () => {
    expect(isWaitingForMentor(data, waiting)).toBe(true);
    expect(isWaitingForMentor(data, blocked)).toBe(false);
    expect(isRiskyTeam(data, risky)).toBe(true);
    expect(isRiskyTeam(data, healthy)).toBe(false);
    expect(isRiskyTeam(data, waiting)).toBe(false);
  });

  it("grades a team's health", () => {
    expect(teamHealth(data, healthy)).toBe(TeamHealth.Healthy);
    expect(teamHealth(data, risky)).toBe(TeamHealth.Risky);
    expect(teamHealth(data, blocked)).toBe(TeamHealth.FollowUp);
    expect(teamHealth(data, waiting)).toBeNull();
  });

  it("counts each chip", () => {
    expect(teamCounts(data, teams)).toEqual({
      [UserFilter.All]: 4,
      [UserFilter.Mentored]: 3,
      [UserFilter.Waiting]: 1,
      [UserFilter.Risky]: 1,
    });
  });

  it("filters by chip, program and team, founder or program name", () => {
    const ids = (criteria: Partial<typeof all>) =>
      filterTeams(data, teams, { ...all, ...criteria }).map((team) => team.id);
    expect(ids({})).toEqual(["org-1", "org-2", "org-3", "org-4"]);
    expect(ids({ filter: UserFilter.Mentored })).toEqual([
      "org-1",
      "org-2",
      "org-3",
    ]);
    expect(ids({ filter: UserFilter.Waiting })).toEqual(["org-4"]);
    expect(ids({ filter: UserFilter.Risky })).toEqual(["org-2"]);
    expect(ids({ program: "Kuluçka" })).toEqual(["org-4"]);
    expect(ids({ search: "gül" })).toEqual(["org-1"]);
    expect(ids({ search: "kuluçka" })).toEqual(["org-4"]);
  });

  it("picks an organization's rows", () => {
    expect(ofOrganization(data.users, "org-1").map((user) => user.id)).toEqual([
      "u1",
      "u2",
    ]);
    expect(ofOrganization(data.bottlenecks, "org-1")).toEqual([]);
  });

  it("builds a table row", () => {
    expect(teamRow(data, healthy)).toEqual({
      startup: healthy,
      key: "program-1:org-1",
      mentorship: data.mentorships[0],
      members: [data.users[0], data.users[1]],
      health: TeamHealth.Healthy,
    });
    expect(teamRow(data, waiting)).toMatchObject({
      mentorship: undefined,
      members: [],
      health: null,
    });
  });
});

describe("admin users relative time", () => {
  const now = Date.parse("2026-11-11T12:00:00Z");
  const ago = (minutes: number) =>
    new Date(now - minutes * 60_000).toISOString();

  it("is null without a usable timestamp", () => {
    expect(relativeTime(null, t, now)).toBeNull();
    expect(relativeTime(undefined, t, now)).toBeNull();
    expect(relativeTime("", t, now)).toBeNull();
    expect(relativeTime("not a date", t, now)).toBeNull();
  });

  it("labels minutes, hours, yesterday and days", () => {
    expect(relativeTime(ago(0), t, now)).toEqual({
      label: "Az önce",
      stale: false,
    });
    expect(relativeTime(ago(5), t, now)?.label).toBe("5 dk önce");
    expect(relativeTime(ago(3 * 60), t, now)?.label).toBe("3 saat önce");
    expect(relativeTime(ago(30 * 60), t, now)?.label).toBe("Dün");
    expect(relativeTime(ago(3 * 24 * 60), t, now)).toEqual({
      label: "3 gün önce",
      stale: false,
    });
  });

  it("calls a week-old timestamp stale", () => {
    expect(relativeTime(ago(7 * 24 * 60), t, now)).toEqual({
      label: "7 gün önce",
      stale: true,
    });
  });

  it("measures from the current time by default", () => {
    expect(relativeTime(new Date().toISOString(), t)?.label).toBe("Az önce");
  });
});

describe("withoutClosedTabLinks", () => {
  const links = [
    { href: "/admin/users/mentors?user=m1" },
    { href: "/admin/users/students#top" },
    { href: "/admin/users" },
    { href: "/admin/programs" },
  ];

  it("drops links to tabs the deployment hides, whatever their query or fragment", () => {
    expect(
      withoutClosedTabLinks(links, [
        UserTab.Coordinators,
        UserTab.Students,
        UserTab.Academics,
      ]),
    ).toEqual([
      { href: "/admin/users/students#top" },
      { href: "/admin/users" },
      { href: "/admin/programs" },
    ]);
  });

  it("keeps every link when all tabs are open, and links outside Kullanıcılar always", () => {
    expect(withoutClosedTabLinks(links, Object.values(UserTab))).toEqual(links);
    expect(withoutClosedTabLinks(links, [])).toEqual([
      { href: "/admin/programs" },
    ]);
  });
});
