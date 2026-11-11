import { describe, expect, it } from "vitest";

import type { AdminIntervention } from "@/interfaces/admin-intervention";
import {
  BottleneckSeverity,
  type AdminBottleneck,
  type AdminOverview,
  type AdminRequest,
  type AdminUser,
} from "@/interfaces/admin-overview";
import { MentorshipStatus } from "@/interfaces/coordinator-mentorship";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { ProgramStatus, ProgramType } from "@/interfaces/program";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import {
  activeMentorships,
  ALL_PROGRAMS,
  coordinatorHref,
  daysSinceInstant,
  declinedRequests,
  hasBottleneck,
  interventionCounts,
  interventionEntries,
  interventionFilterOf,
  interventionRows,
  interventionSignals,
  livePrograms,
  matchedThisWeek,
  matchesInterventionFilter,
  matchesSearch,
  matchingSummary,
  missingCoordinatorAccess,
  openFollowUps,
  openRequest,
  organizationIds,
  overviewSummary,
  pairLabel,
  programHealth,
  programsInScope,
  visibleInterventions,
  visibleMatches,
  waitingTeams,
  type InterventionRow,
  type MatchRow,
} from "@/lib/admin-mentorships";
import { ALL_PROGRAM_TYPES } from "@/lib/program-types";
import {
  InterventionFilter,
  InterventionKind,
  MatchingFilter,
  MatchingSort,
} from "@/types/admin-mentorships";
import {
  adminMentorship,
  adminProgram,
  adminStartup,
} from "@test/fixtures/admin-programs";
import { translatorIn } from "@test/translators";

const t = translatorIn("tr", "adminMentorships");
const now = new Date("2026-11-11T12:00:00");

const lumen = adminStartup();
const nova = adminStartup({ id: "org-2", name: "Nova" });
const orbit = adminStartup({ id: "org-3", name: "Orbit" });
const stars = adminProgram({
  coordinatorId: "coord-1",
  coordinatorName: "Deniz Acar",
  startups: [lumen, nova, orbit],
});
const growth = adminProgram({
  id: "program-2",
  name: "Growth",
  type: ProgramType.PeerMentoring,
  startups: [
    adminStartup({
      id: "org-9",
      name: "Kappa",
      programId: "program-2",
      programName: "Growth",
    }),
  ],
});
const closed = adminProgram({
  id: "program-3",
  name: "Closed",
  status: ProgramStatus.Completed,
  startups: [lumen],
});

function overview(overrides: Partial<AdminOverview> = {}): AdminOverview {
  return {
    programs: [stars],
    users: [],
    mentorships: [],
    requests: [],
    bottlenecks: [],
    meetingsLast8Weeks: 0,
    ...overrides,
  };
}

function bottleneck(overrides: Partial<AdminBottleneck> = {}): AdminBottleneck {
  return {
    id: "b-1",
    title: "Finansman",
    severity: BottleneckSeverity.High,
    status: "OPEN",
    organizationId: "org-2",
    organizationName: "Nova",
    createdAt: "2026-11-01T12:00:00",
    ...overrides,
  };
}

function request(overrides: Partial<AdminRequest> = {}): AdminRequest {
  return {
    id: "r-1",
    organizationId: "org-3",
    organizationName: "Orbit",
    mentorId: null,
    mentorName: null,
    supportArea: null,
    status: MentorshipRequestStatus.Pending,
    createdAt: "2026-11-06T12:00:00",
    ...overrides,
  };
}

function coordinator(status: UserAccountStatus): AdminUser {
  return {
    id: "coord-1",
    email: "deniz@teknokent.com",
    fullName: "Deniz Acar",
    role: UserRole.Coordinator,
    status,
    organizationId: null,
    organizationName: null,
    jobTitle: null,
  };
}

function follow(overrides: Partial<AdminIntervention> = {}): AdminIntervention {
  return {
    id: "follow-1",
    mentorshipId: "m-1",
    coordinatorId: "coord-1",
    coordinatorName: "Deniz Acar",
    openedByName: "Admin",
    action: "48 saat içinde görüşme planlansın",
    note: null,
    openedAt: "2026-11-10T10:00:00Z",
    readAt: null,
    plannedMeetingAt: null,
    resolvedAt: null,
    ...overrides,
  };
}

function row(overrides: Partial<InterventionRow> = {}): InterventionRow {
  return {
    id: "m-1",
    mentorshipId: "m-1",
    kind: InterventionKind.Critical,
    mentorName: "Ayşe Demir",
    teamName: "Lumen",
    programName: "ODTÜ Stars 2026",
    coordinatorName: "Deniz Acar",
    coordinatorId: "coord-1",
    issue: "Görüşme kaydı yok",
    noMeeting: false,
    days: 20,
    goalDone: null,
    goalTotal: null,
    ...overrides,
  };
}

function matchRow(overrides: Partial<MatchRow> = {}): MatchRow {
  return {
    id: "x",
    teamName: "Lumen",
    programName: "ODTÜ Stars 2026",
    coordinatorName: "—",
    coordinatorId: null,
    missingAccess: false,
    need: null,
    waitDays: null,
    ...overrides,
  };
}

describe("program scope", () => {
  it("narrows by type, then by the chosen program", () => {
    const programs = [stars, growth];
    expect(programsInScope(programs, ALL_PROGRAM_TYPES, ALL_PROGRAMS)).toEqual({
      typed: programs,
      programs,
    });
    expect(
      programsInScope(programs, ProgramType.PeerMentoring, ALL_PROGRAMS),
    ).toEqual({ typed: [growth], programs: [growth] });
    expect(programsInScope(programs, ALL_PROGRAM_TYPES, "Growth")).toEqual({
      typed: programs,
      programs: [growth],
    });
  });

  it("keeps only running programs as live", () => {
    expect(livePrograms([stars, closed])).toEqual([stars]);
  });

  it("collects the teams of the programs", () => {
    expect(organizationIds([stars, growth])).toEqual(
      new Set(["org-1", "org-2", "org-3", "org-9"]),
    );
  });
});

describe("mentorship health", () => {
  const late = adminMentorship({ id: "late", daysSinceMeeting: 20 });
  const blocked = adminMentorship({
    id: "blocked",
    organizationId: "org-2",
    daysSinceMeeting: 2,
  });
  const fine = adminMentorship({
    id: "fine",
    organizationId: "org-3",
    daysSinceMeeting: 1,
  });
  const paused = adminMentorship({
    id: "paused",
    organizationId: "org-3",
    status: MentorshipStatus.Paused,
  });
  const elsewhere = adminMentorship({ id: "elsewhere", organizationId: "x" });
  const data = overview({
    mentorships: [late, blocked, fine, paused, elsewhere],
    bottlenecks: [bottleneck()],
  });

  it("lists the active pairs of the programs", () => {
    expect(activeMentorships(data, [stars])).toEqual([late, blocked, fine]);
  });

  it("knows which teams have a bottleneck", () => {
    expect(hasBottleneck(data, "org-2")).toBe(true);
    expect(hasBottleneck(data, "org-1")).toBe(false);
  });

  it("sorts active pairs into late, blocked and fine", () => {
    expect(programHealth(stars, data, now)).toEqual({
      completed: false,
      green: 1,
      amber: 1,
      red: 1,
      active: 3,
    });
  });

  it("counts nothing for a completed program", () => {
    expect(programHealth(closed, data, now)).toEqual({
      completed: true,
      green: 0,
      amber: 0,
      red: 0,
      active: 0,
    });
  });
});

describe("daysSinceInstant", () => {
  it("counts whole days and never goes below zero", () => {
    expect(daysSinceInstant("2026-11-09T13:00:00", now)).toBe(1);
    expect(daysSinceInstant("2026-11-20T12:00:00", now)).toBe(0);
  });
});

describe("interventionRows", () => {
  it("lists late pairs with their team's bottlenecks, then blocked teams", () => {
    const data = overview({
      mentorships: [
        adminMentorship({ startDate: "2026-10-01", goalDone: 1, goalTotal: 3 }),
        adminMentorship({
          id: "m-2",
          organizationId: "org-2",
          organizationName: "Nova",
          daysSinceMeeting: 15,
        }),
        adminMentorship({
          id: "m-3",
          mentorName: "Kerem Tan",
          organizationId: "org-3",
          organizationName: "Orbit",
          daysSinceMeeting: 3,
          goalDone: 0,
          goalTotal: 2,
        }),
      ],
      bottlenecks: [
        bottleneck({ id: "b-1", organizationId: "org-1", title: "Ekip" }),
        bottleneck({ id: "b-2", organizationId: "org-2" }),
        bottleneck({
          id: "b-3",
          organizationId: "org-3",
          organizationName: "Orbit",
          title: "Pazar",
          createdAt: "2026-11-05T12:00:00",
        }),
        bottleneck({
          id: "b-4",
          organizationId: "org-3",
          organizationName: "Orbit",
          title: "Satış",
          createdAt: "2026-11-03T12:00:00",
        }),
        bottleneck({ id: "b-5", organizationId: "org-9" }),
      ],
    });

    expect(interventionRows(data, [stars], t, now)).toEqual([
      {
        id: "m-1",
        mentorshipId: "m-1",
        kind: InterventionKind.Critical,
        mentorName: "Ayşe Demir",
        teamName: "Lumen",
        programName: "ODTÜ Stars 2026",
        coordinatorName: "Deniz Acar",
        coordinatorId: "coord-1",
        issue: "Görüşme kaydı yok · Ekip",
        noMeeting: true,
        days: 41,
        goalDone: 1,
        goalTotal: 3,
      },
      expect.objectContaining({
        id: "m-2",
        kind: InterventionKind.Critical,
        issue: "Son görüşme 15 gün önce · Finansman",
        noMeeting: false,
        days: 15,
        goalDone: null,
        goalTotal: null,
      }),
      {
        id: "b-3:b-4",
        mentorshipId: "m-3",
        kind: InterventionKind.Bottleneck,
        mentorName: "Kerem Tan",
        teamName: "Orbit",
        programName: "ODTÜ Stars 2026",
        coordinatorName: "Deniz Acar",
        coordinatorId: "coord-1",
        issue: "Pazar · Satış",
        noMeeting: false,
        days: 8,
        goalDone: 0,
        goalTotal: 2,
      },
    ]);
  });

  it("names no mentor for a blocked team without an active pair", () => {
    const rows = interventionRows(
      overview({
        mentorships: [
          adminMentorship({
            organizationId: "org-2",
            status: MentorshipStatus.Completed,
          }),
        ],
        bottlenecks: [bottleneck()],
      }),
      [stars],
      t,
      now,
    );
    expect(rows).toEqual([
      expect.objectContaining({
        mentorshipId: null,
        mentorName: "Mentor yok",
        goalDone: null,
        goalTotal: null,
      }),
    ]);
  });
});

describe("overviewSummary", () => {
  it("counts active pairs, interventions and the average meeting gap of live programs", () => {
    const data = overview({
      programs: [stars, closed],
      mentorships: [
        adminMentorship({ daysSinceMeeting: 20 }),
        adminMentorship({
          id: "m-2",
          organizationId: "org-2",
          daysSinceMeeting: 3,
        }),
        adminMentorship({ id: "m-3", organizationId: "org-3" }),
      ],
      bottlenecks: [bottleneck({ organizationId: "org-3" })],
    });
    expect(overviewSummary(data, [stars, closed], t, now)).toEqual({
      activeCount: 3,
      activeProgramCount: 1,
      criticalCount: 2,
      criticalProgramCount: 1,
      bottleneckCount: 0,
      averageGap: 12,
    });
  });

  it("has no average gap when no pair has met", () => {
    const data = overview({ bottlenecks: [bottleneck()] });
    expect(overviewSummary(data, [stars], t, now)).toEqual({
      activeCount: 0,
      activeProgramCount: 0,
      criticalCount: 0,
      criticalProgramCount: 0,
      bottleneckCount: 1,
      averageGap: null,
    });
  });
});

describe("intervention filters", () => {
  const open = openFollowUps([
    follow({ id: "unread", mentorshipId: "m-1" }),
    follow({ id: "read", mentorshipId: "m-2", readAt: "2026-11-10T11:00:00Z" }),
    follow({
      id: "done",
      mentorshipId: "m-3",
      resolvedAt: "2026-11-10T12:00:00Z",
    }),
  ]);
  const entries = interventionEntries(
    [
      row({ id: "m-1", mentorshipId: "m-1" }),
      row({
        id: "m-2",
        mentorshipId: "m-2",
        kind: InterventionKind.Bottleneck,
      }),
      row({ id: "m-3", mentorshipId: "m-3", teamName: "Orbit" }),
      row({
        id: "b",
        mentorshipId: null,
        kind: InterventionKind.Bottleneck,
        programName: "Growth",
        mentorName: "Mentor yok",
      }),
    ],
    open,
  );

  it("reads the filter from the URL, or shows every row", () => {
    expect(interventionFilterOf("BOTTLENECK")).toBe(
      InterventionFilter.Bottleneck,
    );
    expect(interventionFilterOf("nope")).toBe(InterventionFilter.All);
    expect(interventionFilterOf(null)).toBe(InterventionFilter.All);
  });

  it("keeps open follow-ups only and attaches them to their rows", () => {
    expect([...open.keys()]).toEqual(["m-1", "m-2"]);
    expect(entries.map((entry) => entry.tracked?.id)).toEqual([
      "unread",
      "read",
      undefined,
      undefined,
    ]);
  });

  it("matches each filter", () => {
    const [unread, read, critical, blocked] = entries;
    if (!unread || !read || !critical || !blocked) throw new Error("rows");
    expect(matchesInterventionFilter(unread, InterventionFilter.All)).toBe(
      true,
    );
    expect(
      matchesInterventionFilter(critical, InterventionFilter.Critical),
    ).toBe(true);
    expect(matchesInterventionFilter(unread, InterventionFilter.Critical)).toBe(
      false,
    );
    expect(
      matchesInterventionFilter(blocked, InterventionFilter.Bottleneck),
    ).toBe(true);
    expect(matchesInterventionFilter(read, InterventionFilter.Bottleneck)).toBe(
      false,
    );
    expect(
      matchesInterventionFilter(unread, InterventionFilter.Unanswered),
    ).toBe(true);
    expect(matchesInterventionFilter(read, InterventionFilter.Unanswered)).toBe(
      false,
    );
    expect(matchesInterventionFilter(read, InterventionFilter.Assigned)).toBe(
      true,
    );
    expect(
      matchesInterventionFilter(critical, InterventionFilter.Assigned),
    ).toBe(false);
  });

  it("counts the rows of each filter", () => {
    expect(interventionCounts(entries)).toEqual({
      [InterventionFilter.All]: 4,
      [InterventionFilter.Critical]: 1,
      [InterventionFilter.Bottleneck]: 1,
      [InterventionFilter.Unanswered]: 1,
      [InterventionFilter.Assigned]: 2,
    });
  });

  it("narrows by filter, program and search", () => {
    const ids = (filter: InterventionFilter, program: string, search: string) =>
      visibleInterventions(entries, { filter, program, search }).map(
        (entry) => entry.row.id,
      );
    expect(ids(InterventionFilter.All, ALL_PROGRAMS, "")).toEqual([
      "m-1",
      "m-2",
      "m-3",
      "b",
    ]);
    expect(ids(InterventionFilter.Assigned, ALL_PROGRAMS, "")).toEqual([
      "m-1",
      "m-2",
    ]);
    expect(ids(InterventionFilter.All, "Growth", "")).toEqual(["b"]);
    expect(ids(InterventionFilter.All, ALL_PROGRAMS, "ORBİT")).toEqual(["m-3"]);
  });
});

describe("search and labels", () => {
  it("searches case-insensitively in Turkish", () => {
    expect(matchesSearch(["İstanbul", "Lumen"], "istanbul")).toBe(true);
    expect(matchesSearch(["Lumen"], "nova")).toBe(false);
  });

  it("labels a pair", () => {
    expect(pairLabel({ mentorName: "Ayşe", teamName: "Lumen" })).toBe(
      "Ayşe ↔ Lumen",
    );
  });

  it("links to the coordinator, or to the users screen", () => {
    expect(coordinatorHref("coord 1")).toBe("/admin/users?user=coord%201");
    expect(coordinatorHref(null)).toBe("/admin/users");
  });
});

describe("interventionSignals", () => {
  it("flags a pair that has never met and has done no task", () => {
    expect(
      interventionSignals(
        row({ noMeeting: true, days: 3, goalDone: null, goalTotal: 2 }),
        t,
      ),
    ).toEqual([
      { label: "Son görüşme", value: "Kayıt yok", alert: true },
      { label: "Görev", value: "0 / 2", alert: true },
      { label: "Sorun", value: "Görüşme kaydı yok" },
    ]);
  });

  it("flags a late meeting and leaves out tasks when there are none", () => {
    expect(interventionSignals(row({ days: 14, goalTotal: 0 }), t)).toEqual([
      { label: "Son görüşme", value: "14 gün önce", alert: true },
      { label: "Sorun", value: "Görüşme kaydı yok" },
    ]);
  });

  it("does not flag a recent meeting or started tasks", () => {
    expect(
      interventionSignals(row({ days: 5, goalDone: 1, goalTotal: 2 }), t),
    ).toEqual([
      { label: "Son görüşme", value: "5 gün önce", alert: false },
      { label: "Görev", value: "1 / 2", alert: false },
      { label: "Sorun", value: "Görüşme kaydı yok" },
    ]);
    expect(interventionSignals(row({ days: null }), t)[0]).toEqual({
      label: "Son görüşme",
      value: "—",
      alert: false,
    });
  });
});

describe("matching", () => {
  it("knows when a program's coordinator cannot act", () => {
    expect(missingCoordinatorAccess(overview(), undefined)).toBe(false);
    expect(missingCoordinatorAccess(overview(), stars)).toBe(false);
    expect(
      missingCoordinatorAccess(
        overview({ users: [coordinator(UserAccountStatus.Pending)] }),
        stars,
      ),
    ).toBe(true);
    expect(
      missingCoordinatorAccess(
        overview({ users: [coordinator(UserAccountStatus.Approved)] }),
        stars,
      ),
    ).toBe(false);
  });

  it("finds a team's unanswered request", () => {
    const data = overview({
      requests: [
        request({ id: "declined", status: MentorshipRequestStatus.Declined }),
        request({
          id: "info",
          status: MentorshipRequestStatus.MoreInfoRequested,
        }),
        request({
          id: "counter",
          organizationId: "org-2",
          status: MentorshipRequestStatus.CounterProposed,
        }),
        request({ id: "pending", organizationId: "org-1" }),
      ],
    });
    expect(openRequest(data, "org-3")?.id).toBe("info");
    expect(openRequest(data, "org-2")?.id).toBe("counter");
    expect(openRequest(data, "org-1")?.id).toBe("pending");
    expect(openRequest(data, "org-9")).toBeNull();
  });

  const data = overview({
    programs: [stars, growth],
    users: [coordinator(UserAccountStatus.Pending)],
    mentorships: [
      adminMentorship({ startDate: "2026-11-08", programId: "program-1" }),
      adminMentorship({
        id: "m-old",
        organizationId: "org-2",
        startDate: "2026-09-01",
      }),
      adminMentorship({
        id: "m-future",
        organizationId: "org-2",
        startDate: "2026-11-20",
      }),
    ],
    requests: [
      request({ id: "r-orbit", supportArea: "Finans" }),
      request({
        id: "r-declined",
        organizationId: "org-2",
        organizationName: "Nova",
        status: MentorshipRequestStatus.Declined,
        createdAt: "2026-11-01T12:00:00",
      }),
      request({
        id: "r-kappa",
        organizationId: "org-9",
        status: MentorshipRequestStatus.Declined,
      }),
    ],
  });

  it("lists teams waiting for a mentor with what they asked for", () => {
    const rows = waitingTeams(
      overview({
        programs: [stars, growth],
        users: [coordinator(UserAccountStatus.Pending)],
        mentorships: [adminMentorship()],
        requests: [request({ supportArea: "Finans" })],
      }),
      [stars],
      now,
    );
    expect(rows).toEqual([
      {
        id: "program-1:org-2",
        teamName: "Nova",
        programName: "ODTÜ Stars 2026",
        coordinatorName: "Deniz Acar",
        coordinatorId: "coord-1",
        missingAccess: true,
        need: null,
        waitDays: null,
      },
      {
        id: "program-1:org-3",
        teamName: "Orbit",
        programName: "ODTÜ Stars 2026",
        coordinatorName: "Deniz Acar",
        coordinatorId: "coord-1",
        missingAccess: true,
        need: "Finans",
        waitDays: 5,
      },
    ]);
  });

  it("names no coordinator for a team whose program is not listed", () => {
    const orphan = adminStartup({ id: "org-7", programId: "gone" });
    const rows = waitingTeams(
      overview({ programs: [adminProgram({ startups: [orphan] })] }),
      [adminProgram({ startups: [orphan] })],
      now,
    );
    expect(rows).toEqual([
      expect.objectContaining({
        coordinatorName: "—",
        coordinatorId: null,
        missingAccess: false,
      }),
    ]);
  });

  it("lists pairs that started in the last seven days", () => {
    expect(matchedThisWeek(data, [stars], now)).toEqual([
      {
        id: "m-1",
        teamName: "Lumen",
        programName: "ODTÜ Stars 2026",
        coordinatorName: "Deniz Acar",
        coordinatorId: "coord-1",
        missingAccess: true,
        need: null,
        waitDays: null,
      },
    ]);
  });

  it("lists declined requests of the programs", () => {
    expect(declinedRequests(data, [stars], now)).toEqual([
      {
        id: "r-declined",
        teamName: "Nova",
        programName: "ODTÜ Stars 2026",
        coordinatorName: "Deniz Acar",
        coordinatorId: "coord-1",
        missingAccess: true,
        need: null,
        waitDays: 10,
      },
    ]);
  });

  it("averages the wait to one decimal and counts the programs", () => {
    const summary = matchingSummary(
      overview({
        programs: [stars, growth],
        requests: [
          request({ createdAt: "2026-11-06T12:00:00" }),
          request({
            id: "r-2",
            organizationId: "org-2",
            createdAt: "2026-11-09T12:00:00",
          }),
          request({
            id: "r-3",
            organizationId: "org-1",
            createdAt: "2026-11-10T12:00:00",
          }),
        ],
      }),
      [stars, growth],
      now,
    );
    expect(
      summary.rows[MatchingFilter.Waiting].map((item) => item.waitDays),
    ).toEqual([1, 2, 5, null]);
    expect(summary.averageWait).toBe(2.7);
    expect(summary.waitingProgramCount).toBe(2);
    expect(summary.rows[MatchingFilter.ThisWeek]).toEqual([]);
    expect(summary.rows[MatchingFilter.Declined]).toEqual([]);
  });

  it("has no average wait without request dates", () => {
    expect(matchingSummary(overview(), [stars], now).averageWait).toBeNull();
  });
});

describe("visibleMatches", () => {
  const rows = [
    matchRow({ id: "a", teamName: "Zeta", waitDays: 2, need: "Finans" }),
    matchRow({ id: "b", teamName: "Çınar", waitDays: null }),
    matchRow({ id: "c", teamName: "Beta", waitDays: 5, programName: "Growth" }),
  ];

  it("sorts by longest wait, teams without a date last", () => {
    expect(
      visibleMatches(rows, {
        program: ALL_PROGRAMS,
        search: "",
        sort: MatchingSort.Wait,
      }).map((item) => item.id),
    ).toEqual(["c", "a", "b"]);
  });

  it("sorts by team name in Turkish order", () => {
    expect(
      visibleMatches(rows, {
        program: ALL_PROGRAMS,
        search: "",
        sort: MatchingSort.Name,
      }).map((item) => item.id),
    ).toEqual(["c", "b", "a"]);
  });

  it("does not match a team with no stated need on the word null", () => {
    const query = {
      program: ALL_PROGRAMS,
      sort: MatchingSort.Name,
    };
    const noNeed = matchRow({ id: "no-need", need: null });
    expect(visibleMatches([noNeed], { ...query, search: "null" })).toEqual([]);
    expect(
      visibleMatches([noNeed], { ...query, search: "lumen" }).map(
        (item) => item.id,
      ),
    ).toEqual(["no-need"]);
  });

  it("narrows by program and search", () => {
    expect(
      visibleMatches(rows, {
        program: "Growth",
        search: "",
        sort: MatchingSort.Wait,
      }).map((item) => item.id),
    ).toEqual(["c"]);
    expect(
      visibleMatches(rows, {
        program: ALL_PROGRAMS,
        search: "finans",
        sort: MatchingSort.Wait,
      }).map((item) => item.id),
    ).toEqual(["a"]);
  });
});
