import { describe, expect, it } from "vitest";

import {
  TeamJoinStatus,
  type ProgramTeam,
} from "@/interfaces/coordinator-program";
import {
  codeSentLabel,
  daysWaiting,
  filterTeams,
  isTeamProblem,
  setupSteps,
  TeamFilter,
  teamFilterOptions,
  TeamRowProblem,
  teamRowProblems,
  waitingTeamCount,
} from "@/lib/program-launch";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";
import { translatorIn } from "@test/translators";

const t = translatorIn("tr", "coordinatorPrograms");
const tEn = translatorIn("en", "coordinatorPrograms");
const tTeams = translatorIn("tr", "programTeams");
const tTeamsEn = translatorIn("en", "programTeams");

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

  it("counts and filters teams by join status", () => {
    const teams = [
      team(),
      team({ inviteId: "invite-2", status: TeamJoinStatus.Joined }),
    ];
    expect(
      teamFilterOptions(teams, tTeamsEn).map((option) => option.label),
    ).toEqual(["All 2", "Joined 1", "Waiting for the lead 1", "Problems 0"]);
    expect(
      teamFilterOptions(teams, tTeams).map((option) => option.label),
    ).toEqual(["Tümü 2", "Katıldı 1", "Yetkili bekleniyor 1", "Sorunlu 0"]);
    expect(filterTeams(teams, TeamFilter.Waiting)).toEqual([teams[0]]);
    expect(
      daysWaiting("2026-09-20T10:00:00Z", new Date("2026-09-23T11:00:00Z")),
    ).toBe(3);
  });

  it("puts a refused code email under Sorunlu and says when a code went out", () => {
    const refused = team({ inviteId: "invite-3", codeSendFailed: true });
    const sent = team({ codeSentAt: "2026-09-19T10:00:00Z" });
    const teams = [sent, refused];

    expect(
      teamFilterOptions(teams, tTeams).map((option) => option.label),
    ).toEqual(["Tümü 2", "Katıldı 0", "Yetkili bekleniyor 1", "Sorunlu 1"]);
    expect(filterTeams(teams, TeamFilter.Problem)).toEqual([refused]);
    expect(filterTeams(teams, TeamFilter.Waiting)).toEqual([sent]);
    expect(
      isTeamProblem(
        team({ status: TeamJoinStatus.Joined, codeSendFailed: true }),
      ),
    ).toBe(false);
    expect(codeSentLabel(sent, tTeams, "tr")).toBe(
      "Gönderildi 19 Eyl · deniz@kavsak.co",
    );
    expect(codeSentLabel(sent, tTeamsEn, "en")).toBe(
      "Sent Sep 19 · deniz@kavsak.co",
    );
    expect(codeSentLabel(refused, tTeams, "tr")).toBeNull();
  });

  it("lists setup steps until the program has teams, mentors and mentorships", () => {
    const fresh = coordinatorProgramDetail();
    fresh.program.mentorCount = 0;
    fresh.program.activeMentorshipCount = 0;
    const steps = setupSteps(fresh, [team()], t);

    expect(steps?.map((step) => step.done)).toEqual([true, true, false, false]);
    expect(steps?.[1]?.detail).toBe("0 yetkili katıldı · 1 bekleniyor");
    expect(setupSteps(fresh, [team()], tEn)?.[1]?.detail).toBe(
      "0 leads joined · 1 waiting",
    );
    expect(setupSteps(coordinatorProgramDetail(), [team()], t)).toBeNull();
  });
});

describe("waitingTeamCount", () => {
  it("counts the listed teams the program does not count yet", () => {
    expect(
      waitingTeamCount(
        [
          team(),
          team({ inviteId: "invite-2" }),
          team({ inviteId: "invite-3", status: TeamJoinStatus.Joined }),
          // Joined, but the team is still waiting for approval, so the program does not count it yet.
          team({ inviteId: "invite-4", status: TeamJoinStatus.Joined }),
        ],
        1,
      ),
    ).toBe(3);
    expect(waitingTeamCount([team()], 4)).toBe(0);
  });
});
