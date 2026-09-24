import { describe, expect, it } from "vitest";

import { ProgramLifecycle } from "@/interfaces/coordinator-program";
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
import { coordinatorProgram, phase } from "@test/fixtures/coordinator-programs";

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
  status: "COMPLETED",
});
const all = [active, upcoming, completed];

describe("coordinator program helpers", () => {
  it("labels each filter with its count", () => {
    expect(programFilterOptions(all).map((option) => option.label)).toEqual([
      "Tümü 3",
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

  it("counts waiting teams, pending mentors and risky mentorships as actions", () => {
    expect(openActionCount(active)).toBe(5 + 3 + 6);
  });

  it("formats a program's months, and nothing without dates", () => {
    expect(formatMonthRange("2026-02-01", "2026-12-10")).toBe(
      "Şub 2026 – Ara 2026",
    );
    expect(formatMonthRange(null, null)).toBe("");
  });

  it("counts whole days until a start date, never negative", () => {
    const today = new Date(2026, 8, 24, 15, 0);
    expect(daysUntil("2026-11-05", today)).toBe(42);
    expect(daysUntil("2026-09-01", today)).toBe(0);
  });

  it("marks phases before the current one as done", () => {
    const phases = [
      phase("p1", "Başvuru", 0),
      phase("p2", "Eşleşme", 1),
      phase("p3", "Demo Day", 2),
    ];
    const states = phaseStates(
      coordinatorProgram({ phases, currentPhase: phases[1] }),
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
