import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import {
  type ProgramTeam,
  TeamJoinStatus,
} from "@/interfaces/coordinator-program";
import {
  createProgramInput,
  daysWaiting,
  emptyLaunchDraft,
  codeSentLabel,
  filterTeams,
  isTeamProblem,
  parseTeamsCsv,
  setupSteps,
  TeamFilter,
  teamCodePrefix,
  teamFilterOptions,
  TeamRowProblem,
  teamRowProblems,
} from "@/lib/program-launch";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";

import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

const t = createTranslator({
  locale: "tr",
  messages: tr,
  namespace: "coordinatorPrograms",
});
const tEn = createTranslator({
  locale: "en",
  messages: en,
  namespace: "coordinatorPrograms",
});

function team(overrides: Partial<ProgramTeam> = {}): ProgramTeam {
  return {
    inviteId: "invite-1",
    organizationId: null,
    name: "Kavşak",
    status: TeamJoinStatus.Waiting,
    leadName: null,
    leadEmail: "deniz@kavsak.co",
    code: "BIGG26-K4TX",
    invitedAt: "2026-09-20T10:00:00Z",
    joinedAt: null,
    memberCount: 0,
    codeSentAt: null,
    codeSendFailed: false,
    ...overrides,
  };
}

describe("program launch helpers", () => {
  it("previews the same code prefix as the backend", () => {
    expect(teamCodePrefix("METU BİGG 2026")).toBe("BIGG26");
    expect(teamCodePrefix("METU Stars 2026")).toBe("STARS26");
    expect(teamCodePrefix("Hızlandırma")).toBe("HIZLAN");
    expect(teamCodePrefix("")).toBe("TAKIM");
  });

  it("flags rows with a missing name, a bad email or a repeated email", () => {
    const rows = [
      { key: "a", teamName: "Kavşak", leadEmail: "deniz@kavsak.co" },
      { key: "b", teamName: "Tohum", leadEmail: "can@tohum" },
      { key: "c", teamName: "", leadEmail: "eda@lira.app" },
      { key: "d", teamName: "Mira", leadEmail: "DENIZ@kavsak.co" },
      { key: "e", teamName: "", leadEmail: "" },
    ];
    const problems = teamRowProblems(rows);

    expect(problems.get("a")).toBeUndefined();
    expect(problems.get("b")).toBe(TeamRowProblem.InvalidEmail);
    expect(problems.get("c")).toBe(TeamRowProblem.MissingName);
    expect(problems.get("d")).toBe(TeamRowProblem.DuplicateEmail);
    expect(problems.has("e")).toBe(false);
  });

  it("reads team rows from a CSV, skipping the header", () => {
    const rows = parseTeamsCsv(
      "Takım adı,E-posta\nKavşak, deniz@kavsak.co\n\nMira Bio;selin@mirabio.com\n",
    );
    expect(
      rows.map(({ teamName, leadEmail }) => [teamName, leadEmail]),
    ).toEqual([
      ["Kavşak", "deniz@kavsak.co"],
      ["Mira Bio", "selin@mirabio.com"],
    ]);
  });

  it("builds the create request without blank rows or empty dates", () => {
    const draft = emptyLaunchDraft();
    draft.name = "  METU BİGG 2026 ";
    draft.teams = [
      { key: "a", teamName: " Kavşak ", leadEmail: "deniz@kavsak.co " },
      { key: "b", teamName: "", leadEmail: "" },
    ];

    expect(createProgramInput(draft)).toEqual({
      name: "METU BİGG 2026",
      description: null,
      startDate: null,
      endDate: null,
      coordinatorIds: [],
      defaultMentorCapacity: 4,
      meetingFrequencyDays: 14,
      communicationGapDays: 14,
      bottleneckFlagDays: 21,
      teams: [{ teamName: "Kavşak", leadEmail: "deniz@kavsak.co" }],
    });
  });

  it("counts and filters teams by join status", () => {
    const teams = [
      team(),
      team({ inviteId: "invite-2", status: TeamJoinStatus.Joined }),
    ];
    expect(teamFilterOptions(teams).map((option) => option.label)).toEqual([
      "Tümü 2",
      "Katıldı 1",
      "Yetkili bekleniyor 1",
      "Sorunlu 0",
    ]);
    expect(filterTeams(teams, TeamFilter.Waiting)).toEqual([teams[0]]);
    expect(
      daysWaiting("2026-09-20T10:00:00Z", new Date("2026-09-23T11:00:00Z")),
    ).toBe(3);
  });

  it("puts a refused code email under Sorunlu and says when a code went out", () => {
    const refused = team({ inviteId: "invite-3", codeSendFailed: true });
    const sent = team({ codeSentAt: "2026-09-19T10:00:00Z" });
    const teams = [sent, refused];

    expect(teamFilterOptions(teams).map((option) => option.label)).toEqual([
      "Tümü 2",
      "Katıldı 0",
      "Yetkili bekleniyor 1",
      "Sorunlu 1",
    ]);
    expect(filterTeams(teams, TeamFilter.Problem)).toEqual([refused]);
    expect(filterTeams(teams, TeamFilter.Waiting)).toEqual([sent]);
    expect(
      isTeamProblem(
        team({ status: TeamJoinStatus.Joined, codeSendFailed: true }),
      ),
    ).toBe(false);
    expect(codeSentLabel(sent)).toBe("Gönderildi 19 Eyl · deniz@kavsak.co");
    expect(codeSentLabel(refused)).toBeNull();
  });

  it("lists setup steps until the program has teams, mentors and mentorships", () => {
    const fresh = coordinatorProgramDetail();
    fresh.program.mentorCount = 0;
    fresh.program.activeMentorshipCount = 0;
    const steps = setupSteps(fresh, [team()], t);

    expect(steps?.map((step) => step.done)).toEqual([true, true, false, false]);
    expect(steps?.[1].detail).toBe("0 yetkili katıldı · 1 bekleniyor");
    expect(setupSteps(fresh, [team()], tEn)?.[1].detail).toBe(
      "0 leads joined · 1 waiting",
    );
    expect(setupSteps(coordinatorProgramDetail(), [team()], t)).toBeNull();
  });
});
