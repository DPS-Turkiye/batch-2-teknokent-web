import { describe, expect, it } from "vitest";

import { ProgramLifecycle } from "@/interfaces/coordinator-program";
import { ProgramStatus, ProgramType } from "@/interfaces/program";
import {
  daysUntil,
  filterPrograms,
  formatMonthRange,
  openActionCount,
  PhaseState,
  phaseStates,
  programFilterOptions,
  ProgramListFilter,
} from "@/lib/coordinator-programs";
import { ALL_PROGRAM_TYPES } from "@/lib/program-types";
import { coordinatorProgram, phase } from "@test/fixtures/coordinator-programs";
import { translatorIn } from "@test/translators";

const t = translatorIn("tr", "coordinatorPrograms");
const tEn = translatorIn("en", "coordinatorPrograms");

const active = coordinatorProgram({ id: "a", name: "METU Stars 2026" });
const upcoming = coordinatorProgram({
  id: "u",
  name: "METU BİGG 2026",
  lifecycle: ProgramLifecycle.Upcoming,
});
const completed = coordinatorProgram({
  id: "c",
  name: "METU Stars 2025",
  lifecycle: ProgramLifecycle.Completed,
  status: ProgramStatus.Completed,
});
const draft = coordinatorProgram({
  id: "d",
  name: "ODTÜ Akran 2027",
  lifecycle: ProgramLifecycle.Draft,
  status: ProgramStatus.Draft,
  type: ProgramType.PeerMentoring,
});
const all = [active, upcoming, completed, draft];

describe("coordinator program helpers", () => {
  it("labels each filter with its count", () => {
    expect(
      programFilterOptions(all, tEn).map((option) => option.label),
    ).toEqual(["All 4", "Draft 1", "Active 1", "Upcoming 1", "Completed 1"]);
    expect(programFilterOptions(all, t).map((option) => option.label)).toEqual([
      "Tümü 4",
      "Taslak 1",
      "Aktif 1",
      "Yaklaşan 1",
      "Tamamlanan 1",
    ]);
  });

  it("filters by lifecycle and a Turkish-aware name search", () => {
    expect(filterPrograms(all, ProgramListFilter.Upcoming, "")).toEqual([
      upcoming,
    ]);
    expect(filterPrograms(all, ProgramListFilter.All, "bigg")).toEqual([
      upcoming,
    ]);
    expect(filterPrograms(all, ProgramListFilter.Active, "2025")).toEqual([]);
  });

  it("filters drafts and program types", () => {
    expect(filterPrograms(all, ProgramListFilter.Draft, "")).toEqual([draft]);
    expect(
      filterPrograms(all, ProgramListFilter.All, "", ProgramType.PeerMentoring),
    ).toEqual([draft]);
    expect(
      filterPrograms(all, ProgramListFilter.All, "", ProgramType.OfficeHours),
    ).toEqual([]);
    expect(
      filterPrograms(all, ProgramListFilter.All, "", ALL_PROGRAM_TYPES),
    ).toHaveLength(4);
  });

  it("counts waiting teams, pending mentors and risky mentorships as actions", () => {
    expect(openActionCount(active)).toBe(5 + 3 + 6);
  });

  it("formats a program's months, and nothing without dates", () => {
    expect(formatMonthRange("2026-02-01", "2026-12-10", "tr")).toBe(
      "Şub 2026 – Ara 2026",
    );
    expect(formatMonthRange("2026-02-01", "2026-12-10", "en")).toBe(
      "Feb 2026 – Dec 2026",
    );
    expect(formatMonthRange(null, null, "tr")).toBe("");
  });

  it("counts whole days until a start date, never negative", () => {
    const today = new Date(2026, 8, 24, 15, 0);
    expect(daysUntil("2026-11-05", today)).toBe(42);
    expect(daysUntil("2026-09-01", today)).toBe(0);
  });

  it("marks phases before the current one as done", () => {
    const matching = phase("p2", "Eşleşme", 1);
    const phases = [
      phase("p1", "Başvuru", 0),
      matching,
      phase("p3", "Demo Day", 2),
    ];
    const states = phaseStates(
      coordinatorProgram({ phases, currentPhase: matching }),
    ).map(({ state }) => state);
    expect(states).toEqual([
      PhaseState.Done,
      PhaseState.Current,
      PhaseState.Upcoming,
    ]);
    expect(
      phaseStates(
        coordinatorProgram({ phases, lifecycle: ProgramLifecycle.Completed }),
      ).every(({ state }) => state === PhaseState.Done),
    ).toBe(true);
  });
});
