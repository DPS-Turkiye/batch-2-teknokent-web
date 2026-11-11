import { describe, expect, it } from "vitest";

import { ProgramLifecycle } from "@/interfaces/coordinator-program";
import { ProgramType } from "@/interfaces/program";
import {
  emptyPhase,
  hasTabContent,
  healthShares,
  isActiveTab,
  misplacedTabHref,
  overviewActions,
  ParticipantTab,
  participantTabs,
  phaseDraftError,
  programHeaderLine,
  ProgramTab,
  programTabs,
  RULE_LIMITS,
  savedPhases,
  settingsDraftError,
  settingsDraftOf,
  SettingsSection,
  settingsSections,
  stepDays,
} from "@/lib/coordinator-program-detail";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";
import { translatorIn } from "@test/translators";

const t = translatorIn("tr", "coordinatorPrograms");
const tEn = translatorIn("en", "coordinatorPrograms");

describe("coordinator program detail", () => {
  it("writes the header line with the phase, week and every coordinator", () => {
    expect(programHeaderLine(coordinatorProgramDetail(), t, "tr")).toContain(
      "Mentorluk dönemi, hafta 6/16 · Koordinatörler: Elif Demir, Burcu Şen",
    );
    expect(programHeaderLine(coordinatorProgramDetail(), tEn, "en")).toContain(
      "Mentorluk dönemi, week 6/16 · Coordinators: Elif Demir, Burcu Şen",
    );
  });

  it("splits the health bar and lists only the actions that need someone", () => {
    const detail = coordinatorProgramDetail();
    const shares = healthShares(detail.health);
    expect(shares.total).toBe(64);
    expect(Math.round(shares.healthy + shares.followUp + shares.risky)).toBe(
      100,
    );
    expect(overviewActions(detail, t).map((action) => action.title)).toEqual([
      "5 takım eşleşme bekliyor",
      "5 mentor yanıt bekliyor",
      "4 görüşme: not eksik",
    ]);
    expect(overviewActions(detail, tEn).map((action) => action.title)).toEqual([
      "5 teams are waiting for a match",
      "5 mentors haven't replied",
      "4 meetings: notes missing",
    ]);
    expect(
      overviewActions(
        coordinatorProgramDetail({
          program: { ...detail.program, awaitingMatchCount: 0 },
          mentors: { ...detail.mentors, pending: 0 },
          missingNoteMeetings: 0,
        }),
        t,
      ),
    ).toEqual([]);
  });

  it("keeps rule days inside their limits", () => {
    expect(stepDays(1, -1, RULE_LIMITS.meetingFrequencyDays)).toBe(1);
    expect(stepDays(90, 1, RULE_LIMITS.meetingFrequencyDays)).toBe(90);
    expect(stepDays(14, 1, RULE_LIMITS.staleAfterDays)).toBe(15);
  });

  it("validates the settings draft, and each phase on its own", () => {
    const detail = coordinatorProgramDetail();
    const draft = settingsDraftOf(detail);
    expect(settingsDraftError(draft)).toBeNull();
    expect(settingsDraftError({ ...draft, name: " " })).toBe(
      "Program adı gerekli.",
    );
    expect(
      settingsDraftError({
        ...draft,
        startDate: "2026-09-10",
        endDate: "2026-09-01",
      }),
    ).toBe("Program bitişi başlangıçtan önce olamaz.");
    expect(savedPhases(detail).map((phase) => phase.name)).toEqual([
      "Başvuru",
      "Mentorluk dönemi",
      "Demo Day",
    ]);
    expect(phaseDraftError(emptyPhase())).toBe("Her fazın bir adı olmalı.");
    expect(
      phaseDraftError({
        ...emptyPhase(),
        name: "Demo Day",
        startDate: "2026-12-10",
        endDate: "2026-12-01",
      }),
    ).toContain("Demo Day");
  });
});

describe("program tabs by type", () => {
  function detailOf(type: ProgramType) {
    const detail = coordinatorProgramDetail();
    return { ...detail, program: { ...detail.program, type } };
  }

  it("keeps Girişim's screens under Katılımcılar with their counts", () => {
    const detail = detailOf(ProgramType.StartupMentoring);
    expect(
      programTabs(detail, "p1").map((tab) => [tab.id, tab.href, tab.count]),
    ).toEqual([
      [ProgramTab.Overview, "/coordinator/programs/p1", null],
      [ProgramTab.Participants, "/coordinator/programs/p1/teams", null],
      [ProgramTab.Matching, "/coordinator/programs/p1/matching", 5],
      [ProgramTab.Approvals, "/coordinator/programs/p1/approvals", 6],
      [ProgramTab.Settings, "/coordinator/programs/p1/settings", null],
    ]);
    expect(participantTabs(detail, "p1")).toEqual([
      {
        id: ParticipantTab.Teams,
        href: "/coordinator/programs/p1/teams",
        count: detail.program.teamCount,
      },
      {
        id: ParticipantTab.MentorPool,
        href: "/coordinator/programs/p1/mentors",
        count: detail.program.mentorCount,
      },
    ]);
    expect(isActiveTab(ProgramTab.Participants, ProgramTab.MentorPool)).toBe(
      true,
    );
    expect(isActiveTab(ProgramTab.Matching, ProgramTab.MentorPool)).toBe(false);
  });

  it("gives Office Hours Randevular in place of Eşleşmeler and no Onaylar", () => {
    const detail = detailOf(ProgramType.OfficeHours);
    expect(programTabs(detail, "p1").map((tab) => tab.id)).toEqual([
      ProgramTab.Overview,
      ProgramTab.Participants,
      ProgramTab.Appointments,
      ProgramTab.Settings,
    ]);
    expect(participantTabs(detail, "p1").map((tab) => tab.id)).toEqual([
      ParticipantTab.Academics,
      ParticipantTab.Students,
    ]);
  });

  it("gives Akran its Öğrenciler and Akran Mentorları lists and leaves its other tabs empty but the settings", () => {
    const detail = detailOf(ProgramType.PeerMentoring);
    expect(programTabs(detail, "p1")[1]?.href).toBe(
      "/coordinator/programs/p1/students",
    );
    expect(
      programTabs({ ...detail, pendingApprovalCount: 0 }, "p1").find(
        (tab) => tab.id === ProgramTab.Approvals,
      )?.count,
    ).toBe(0);
    expect(participantTabs(detail, "p1")).toEqual([
      {
        id: ParticipantTab.Students,
        href: "/coordinator/programs/p1/students",
        count: null,
      },
      {
        id: ParticipantTab.PeerMentors,
        href: "/coordinator/programs/p1/peer-mentors",
        count: null,
      },
    ]);
    expect(hasTabContent(ProgramType.PeerMentoring, ProgramTab.Students)).toBe(
      true,
    );
    expect(
      hasTabContent(ProgramType.PeerMentoring, ProgramTab.PeerMentors),
    ).toBe(true);
    expect(hasTabContent(ProgramType.PeerMentoring, ProgramTab.Matching)).toBe(
      false,
    );
    expect(hasTabContent(ProgramType.PeerMentoring, ProgramTab.Settings)).toBe(
      true,
    );
    expect(
      hasTabContent(ProgramType.StartupMentoring, ProgramTab.Approvals),
    ).toBe(true);
  });

  it("sends tab URLs a type does not show to that type's own tab", () => {
    const base = "/coordinator/programs/p1";
    const startup = detailOf(ProgramType.StartupMentoring);
    const peer = detailOf(ProgramType.PeerMentoring);
    const officeHours = detailOf(ProgramType.OfficeHours);

    expect(misplacedTabHref(startup, "p1", ProgramTab.Participants)).toBe(
      `${base}/teams`,
    );
    expect(misplacedTabHref(startup, "p1", ProgramTab.Appointments)).toBe(
      `${base}/matching`,
    );
    for (const tab of [
      ProgramTab.Overview,
      ProgramTab.Teams,
      ProgramTab.MentorPool,
      ProgramTab.Matching,
      ProgramTab.Approvals,
      ProgramTab.Settings,
    ]) {
      expect(misplacedTabHref(startup, "p1", tab)).toBeNull();
    }

    expect(misplacedTabHref(officeHours, "p1", ProgramTab.Teams)).toBe(
      `${base}/academics`,
    );
    expect(misplacedTabHref(officeHours, "p1", ProgramTab.Participants)).toBe(
      `${base}/academics`,
    );
    expect(
      misplacedTabHref(officeHours, "p1", ProgramTab.Academics),
    ).toBeNull();
    expect(misplacedTabHref(peer, "p1", ProgramTab.Academics)).toBe(
      `${base}/students`,
    );
    expect(misplacedTabHref(startup, "p1", ProgramTab.Academics)).toBe(
      `${base}/teams`,
    );
    expect(misplacedTabHref(officeHours, "p1", ProgramTab.Matching)).toBe(
      `${base}/appointments`,
    );
    expect(misplacedTabHref(officeHours, "p1", ProgramTab.Approvals)).toBe(
      base,
    );
    expect(
      misplacedTabHref(officeHours, "p1", ProgramTab.Appointments),
    ).toBeNull();

    expect(misplacedTabHref(peer, "p1", ProgramTab.MentorPool)).toBe(
      `${base}/students`,
    );
    expect(misplacedTabHref(peer, "p1", ProgramTab.Participants)).toBe(
      `${base}/students`,
    );
    expect(misplacedTabHref(peer, "p1", ProgramTab.Students)).toBeNull();
    expect(misplacedTabHref(startup, "p1", ProgramTab.PeerMentors)).toBe(
      `${base}/teams`,
    );
    expect(misplacedTabHref(officeHours, "p1", ProgramTab.Students)).toBe(
      `${base}/academics`,
    );
    expect(misplacedTabHref(peer, "p1", ProgramTab.Appointments)).toBe(
      `${base}/matching`,
    );
    expect(misplacedTabHref(peer, "p1", ProgramTab.Approvals)).toBeNull();
  });
});

describe("settingsSections", () => {
  it("gives only a peer program the Akran Mentoru training", () => {
    expect(
      settingsSections(ProgramType.PeerMentoring, ProgramLifecycle.Active),
    ).toContain(SettingsSection.Training);
    expect(
      settingsSections(ProgramType.StartupMentoring, ProgramLifecycle.Active),
    ).not.toContain(SettingsSection.Training);
    expect(
      settingsSections(ProgramType.OfficeHours, ProgramLifecycle.Active),
    ).not.toContain(SettingsSection.Training);
  });

  it("lists Akran kategorileri only for peer programs, before Arşiv, and no Arşiv for a draft", () => {
    const peer = settingsSections(
      ProgramType.PeerMentoring,
      ProgramLifecycle.Active,
    );
    expect(peer).toContain(SettingsSection.PeerCategories);
    expect(peer.indexOf(SettingsSection.PeerCategories)).toBe(
      peer.indexOf(SettingsSection.Archive) - 1,
    );
    expect(
      settingsSections(ProgramType.StartupMentoring, ProgramLifecycle.Active),
    ).not.toContain(SettingsSection.PeerCategories);
    expect(
      settingsSections(ProgramType.OfficeHours, ProgramLifecycle.Active),
    ).not.toContain(SettingsSection.PeerCategories);
    expect(
      settingsSections(ProgramType.PeerMentoring, ProgramLifecycle.Draft),
    ).not.toContain(SettingsSection.Archive);
  });
});
