import { describe, expect, it } from "vitest";

import {
  BottleneckSeverity,
  type AdminBottleneck,
  type AdminMentorMembership,
  type AdminOverview,
  type AdminRequest,
} from "@/interfaces/admin-overview";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { ProgramMentorStatus, ProgramStatus } from "@/interfaces/program";
import {
  groupBottlenecks,
  HOME_PROGRAM_SCOPES,
  initialOpenIntervention,
  interventionRows,
  phaseLabel,
  programHealth,
  programsInScope,
  waitingProgramCount,
  type Intervention,
} from "@/lib/admin-home";
import {
  HomeInterventionKind,
  HomeProgramScope,
  InterventionTone,
} from "@/types/admin-home";
import {
  adminMentorship,
  adminProgram,
  adminStartup,
} from "@test/fixtures/admin-programs";
import { translatorIn } from "@test/translators";

const t = translatorIn("tr", "adminHome");

/** Wednesday 11 November 2026, 10:00 local time. */
const NOW = new Date(2026, 10, 11, 10);

const lumen = adminStartup({ id: "org-1", name: "Lumen" });
const nova = adminStartup({ id: "org-2", name: "Nova" });

function bottleneck(overrides: Partial<AdminBottleneck> = {}): AdminBottleneck {
  return {
    id: "b-1",
    title: "Fiyatlama",
    severity: BottleneckSeverity.High,
    status: "OPEN",
    organizationId: "org-1",
    organizationName: "Lumen",
    createdAt: "2026-11-01T09:00:00Z",
    ...overrides,
  };
}

function request(organizationId: string): AdminRequest {
  return {
    id: `r-${organizationId}`,
    organizationId,
    organizationName: "Lumen",
    mentorId: null,
    mentorName: null,
    supportArea: null,
    status: MentorshipRequestStatus.Pending,
    createdAt: "2026-11-01T09:00:00Z",
  };
}

function pendingMentor(fullName: string): AdminMentorMembership {
  return {
    mentorId: fullName,
    fullName,
    email: `${fullName}@menton.test`,
    status: ProgramMentorStatus.Pending,
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

function row(overrides: Partial<Intervention>): Intervention {
  return {
    id: "row",
    kind: HomeInterventionKind.Pair,
    title: "",
    owner: "",
    tone: InterventionTone.Red,
    label: "",
    action: "",
    href: "",
    ...overrides,
  };
}

describe("program scope", () => {
  const live = adminProgram({ id: "live" });
  const done = adminProgram({ id: "done", status: ProgramStatus.Completed });
  const draft = adminProgram({ id: "draft", status: ProgramStatus.Draft });
  const programs = [live, done, draft];

  it("keeps active, completed or all programs", () => {
    expect(programsInScope(programs, HomeProgramScope.Active)).toEqual([live]);
    expect(programsInScope(programs, HomeProgramScope.Completed)).toEqual([
      done,
    ]);
    expect(programsInScope(programs, HomeProgramScope.All)).toEqual(programs);
    expect(HOME_PROGRAM_SCOPES).toEqual([
      HomeProgramScope.All,
      HomeProgramScope.Active,
      HomeProgramScope.Completed,
    ]);
  });
});

describe("alerts and the open row", () => {
  it("counts the programs the waiting teams are in", () => {
    expect(
      waitingProgramCount([
        lumen,
        nova,
        adminStartup({ id: "org-3", programName: "Akran 2026" }),
      ]),
    ).toBe(2);
    expect(waitingProgramCount([])).toBe(0);
  });

  it("opens the first bottleneck row, or none", () => {
    expect(
      initialOpenIntervention([
        row({ id: "pair" }),
        row({ id: "b-1", kind: HomeInterventionKind.Bottleneck }),
        row({ id: "b-2", kind: HomeInterventionKind.Bottleneck }),
      ]),
    ).toBe("b-1");
    expect(initialOpenIntervention([row({ id: "pair" })])).toBeNull();
  });
});

describe("groupBottlenecks", () => {
  it("groups titles that match after trimming, in Turkish case rules", () => {
    const first = bottleneck({ id: "1", title: "Işık" });
    const second = bottleneck({ id: "2", title: " IŞIK " });
    const other = bottleneck({ id: "3", title: "İhracat" });
    expect(groupBottlenecks([first, other, second])).toEqual([
      [first, second],
      [other],
    ]);
  });
});

describe("interventionRows", () => {
  const stars = adminProgram({
    id: "program-1",
    name: "ODTÜ Stars",
    coordinatorId: "coord-1",
    coordinatorName: "Deniz Acar",
    acceptedMentorCount: 2,
    pendingMentorCount: 1,
    startups: [lumen],
  });
  const peer = adminProgram({
    id: "program-2",
    name: "Akran",
    acceptedMentorCount: 3,
    startups: [nova],
    mentors: [pendingMentor("Can Kaya"), pendingMentor("Ece Su")],
  });

  it("lists overdue pairs with their coordinator, or the mentor when there is no program", () => {
    const data = overview({
      programs: [stars],
      mentorships: [
        adminMentorship({
          id: "late",
          daysSinceMeeting: 20,
          progressPercent: 40,
          programId: "program-1",
        }),
        adminMentorship({
          id: "never",
          organizationId: "org-9",
          organizationName: "Orbit",
          startDate: "2026-10-21",
        }),
        adminMentorship({ id: "fine", daysSinceMeeting: 3 }),
      ],
    });
    expect(interventionRows(data, t, NOW)).toEqual([
      {
        id: "late",
        kind: HomeInterventionKind.Pair,
        title: "20 gündür görüşme yok — Ayşe Demir ↔ Lumen",
        subtitle: t("pair.subtitle", { program: "ODTÜ Stars" }),
        owner: "Deniz Acar",
        tone: InterventionTone.Red,
        label: "Kritik",
        action: "Koordinatöre git",
        href: "/admin/users?user=coord-1",
        detail: {
          leftTitle: "İlgili takım",
          chips: ["Lumen"],
          pool: "Hedef ilerlemesi %40",
          poolNote: "Son görüşme 20 gün önce",
          action: t("pair.suggestion"),
        },
      },
      expect.objectContaining({
        id: "never",
        title: "21 gündür görüşme yok — Ayşe Demir ↔ Orbit",
        subtitle: t("pair.subtitle", { program: "Program yok" }),
        owner: "Ayşe Demir",
        href: "/admin/users",
        detail: expect.objectContaining({ poolNote: "Kayıtlı görüşme yok" }),
      }),
    ]);
  });

  it("folds bottlenecks with one title into a row, red when any is critical", () => {
    const data = overview({
      programs: [stars, peer],
      requests: [request("org-1"), request("org-2"), request("org-9")],
      bottlenecks: [
        bottleneck({ id: "b-1" }),
        bottleneck({
          id: "b-2",
          title: "fiyatlama",
          organizationId: "org-2",
          organizationName: "Nova",
          severity: BottleneckSeverity.Critical,
        }),
      ],
    });
    const [recurring] = interventionRows(data, t, NOW);
    expect(recurring).toEqual({
      id: "b-1",
      kind: HomeInterventionKind.Bottleneck,
      title: "Tekrarlayan darboğaz — 2 takımda fiyatlama",
      owner: "Deniz Acar",
      tone: InterventionTone.Red,
      label: "Kritik",
      action: "İncele",
      href: "/admin/mentorships/interventions",
      detail: {
        leftTitle: "Etkilenen takımlar",
        chips: ["Lumen", "Nova"],
        pool: "Kabul edilmiş mentor: 5",
        demand: "· talep 2",
        poolNote: "1 davet henüz kabul edilmedi",
        action: t("bottleneck.suggestion"),
      },
    });
  });

  it("shows a single bottleneck outside any program in amber, without demand or invites", () => {
    const data = overview({
      bottlenecks: [
        bottleneck({ organizationId: "org-9", organizationName: "Orbit" }),
      ],
    });
    expect(interventionRows(data, t, NOW)).toEqual([
      expect.objectContaining({
        title: "Fiyatlama",
        owner: "Orbit",
        tone: InterventionTone.Amber,
        label: "Dikkat",
        detail: expect.objectContaining({
          pool: "Kabul edilmiş mentor: 0",
          demand: undefined,
          poolNote: undefined,
        }),
      }),
    ]);
  });

  it("adds one row per program with mentors waiting for approval", () => {
    const data = overview({
      programs: [
        peer,
        adminProgram({
          id: "program-3",
          name: "Ofis",
          coordinatorName: "Deniz Acar",
          mentors: [pendingMentor("Ali Veli")],
        }),
      ],
    });
    expect(interventionRows(data, t, NOW)).toEqual([
      {
        id: "access:Akran",
        kind: HomeInterventionKind.Access,
        title: "Koordinatör müdahalesi gerekenler — 2 ilişki",
        subtitle: "Akran · davet kabul edilmedi",
        owner: "Koordinatör",
        tone: InterventionTone.Neutral,
        label: "Bekliyor",
        action: "Görevlendir",
        href: "/admin/users/mentors",
        detail: {
          leftTitle: "Davet bekleyen mentorlar",
          chips: ["Can Kaya", "Ece Su"],
          pool: "Bekleyen davet: 2",
          action: t("access.suggestion"),
        },
      },
      expect.objectContaining({ id: "access:Ofis", owner: "Deniz Acar" }),
    ]);
  });

  it("is empty when nothing needs attention", () => {
    expect(interventionRows(overview(), t, NOW)).toEqual([]);
  });
});

describe("programHealth", () => {
  it("grades each team red, amber or green", () => {
    const teams = ["org-1", "org-2", "org-3", "org-4"].map((id) =>
      adminStartup({ id }),
    );
    const program = adminProgram({ startups: teams });
    const data = overview({
      programs: [program],
      mentorships: [
        adminMentorship({ id: "late", daysSinceMeeting: 20 }),
        adminMentorship({
          id: "blocked",
          organizationId: "org-2",
          daysSinceMeeting: 2,
        }),
        adminMentorship({
          id: "fine",
          organizationId: "org-4",
          daysSinceMeeting: 2,
        }),
      ],
      bottlenecks: [bottleneck({ organizationId: "org-2" })],
    });
    expect(programHealth(program, data, NOW)).toEqual({
      green: 1,
      amber: 2,
      red: 1,
    });
  });
});

describe("phaseLabel", () => {
  it("says completed, in setup since creation, or the week of mentoring", () => {
    const team = adminStartup({ id: "org-1" });
    const setup = adminProgram({
      createdAt: new Date(2026, 2, 15, 12).toISOString(),
      startups: [team],
    });
    expect(
      phaseLabel(
        adminProgram({ status: ProgramStatus.Completed }),
        overview(),
        t,
        "tr",
        NOW,
      ),
    ).toBe("Tamamlandı");
    expect(phaseLabel(setup, overview(), t, "tr", NOW)).toBe(
      "Kurulum · 15 Mar",
    );
    const started = overview({
      mentorships: [
        adminMentorship({ startDate: "2026-10-21" }),
        adminMentorship({
          id: "november-1",
          organizationId: "org-2",
          startDate: "2026-11-01",
        }),
        adminMentorship({
          id: "november-5",
          organizationId: "org-3",
          startDate: "2026-11-05",
        }),
      ],
    });
    const threeTeams = adminProgram({
      startups: [
        adminStartup({ id: "org-2" }),
        team,
        adminStartup({ id: "org-3" }),
      ],
    });
    expect(phaseLabel(threeTeams, started, t, "tr", NOW)).toBe(
      "Mentorluk · hafta 3",
    );
    const today = overview({
      mentorships: [adminMentorship({ startDate: "2026-11-11" })],
    });
    expect(phaseLabel(setup, today, t, "tr", NOW)).toBe("Mentorluk · hafta 1");
  });
});
