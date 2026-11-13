import { describe, expect, it } from "vitest";

import { emptyPhase, type PhaseDraft } from "@/lib/coordinator-program-detail";
import {
  dayShift,
  joinOutputs,
  missingDate,
  monthSpan,
  outputTokens,
  phaseDateLocks,
  phaseDateRange,
  phaseStatus,
  PhaseStatus,
  ProgramFileProblem,
  programFileProblem,
  reorderPhases,
  timelineSegments,
} from "@/lib/program-phases";

const phase = (patch: Partial<PhaseDraft>): PhaseDraft => ({
  ...emptyPhase(),
  ...patch,
});

describe("program phases", () => {
  it("edits expected outputs as chips and stores them as one line", () => {
    expect(outputTokens("Pilot müşteri · Fiyat hipotezi ")).toEqual([
      "Pilot müşteri",
      "Fiyat hipotezi",
    ]);
    expect(outputTokens(null)).toEqual([]);
    expect(joinOutputs(["Pilot müşteri", "Fiyat hipotezi"])).toBe(
      "Pilot müşteri · Fiyat hipotezi",
    );
    expect(joinOutputs([])).toBeNull();
    expect(joinOutputs(["x".repeat(250)])).toHaveLength(200);
  });

  it("moves a dragged row to where it was dropped", () => {
    expect(reorderPhases(["a", "b", "c", "d"], 0, 2)).toEqual([
      "b",
      "c",
      "a",
      "d",
    ]);
    expect(reorderPhases(["a", "b"], 1, 5)).toEqual(["a", "b"]);
  });

  it("sizes the timeline by phase length and gives an undated phase the typical width", () => {
    const segments = timelineSegments([
      phase({ name: "Keşif", startDate: "2026-11-01", endDate: "2026-11-30" }),
      phase({ name: "MVP", startDate: "2026-12-01", endDate: "2027-01-29" }),
      phase({ name: "Demo Day" }),
    ]);

    expect(segments.map((segment) => segment.weight)).toEqual([30, 60, 45]);
    expect(segments.map((segment) => segment.missing)).toEqual([
      false,
      false,
      true,
    ]);
  });

  it("formats phase dates and the program length", () => {
    expect(
      phaseDateRange(
        phase({ startDate: "2026-11-03", endDate: "2026-11-30" }),
        "tr",
      ),
    ).toBe("3 Kas – 30 Kas");
    expect(phaseDateRange(phase({}), "tr")).toBeNull();
    expect(missingDate(phase({ startDate: "2026-11-03" }))).toBe(true);
    expect(monthSpan("2026-11-03", "2027-09-30")).toBe(11);
    expect(monthSpan(null, "2027-09-30")).toBeNull();
  });
});

describe("phases in Program Ayarları", () => {
  const dated = (startDate: string | null, endDate: string | null) =>
    phase({ name: "Faz", startDate, endDate });

  it("tells finished, running and planned phases apart", () => {
    const today = "2026-03-10";
    expect(phaseStatus(dated("2026-02-01", "2026-02-28"), today)).toBe(
      PhaseStatus.Done,
    );
    expect(phaseStatus(dated("2026-03-01", "2026-11-15"), today)).toBe(
      PhaseStatus.Current,
    );
    expect(phaseStatus(dated("2026-03-10", null), today)).toBe(
      PhaseStatus.Current,
    );
    expect(phaseStatus(dated("2026-03-11", "2026-04-01"), today)).toBe(
      PhaseStatus.Planned,
    );
    expect(phaseStatus(dated(null, null), today)).toBe(PhaseStatus.Planned);
  });

  it("locks both dates of a finished phase and only the start of a running one", () => {
    expect(phaseDateLocks(PhaseStatus.Done)).toEqual({
      start: true,
      end: true,
    });
    expect(phaseDateLocks(PhaseStatus.Current)).toEqual({
      start: true,
      end: false,
    });
    expect(phaseDateLocks(PhaseStatus.Planned)).toEqual({
      start: false,
      end: false,
    });
  });

  it("counts the days a date moved", () => {
    expect(dayShift("2026-11-15", "2026-11-29")).toBe(14);
    expect(dayShift("2026-11-29", "2026-11-15")).toBe(-14);
  });

  it("accepts only PDFs up to 10 MB", () => {
    expect(programFileProblem(new File(["x"], "haftalik.pdf"))).toBeNull();
    expect(programFileProblem(new File(["x"], "haftalik.docx"))).toBe(
      ProgramFileProblem.NotPdf,
    );
    const large = new File(["x"], "haftalik.pdf", { type: "application/pdf" });
    Object.defineProperty(large, "size", { value: 11 * 1024 * 1024 });
    expect(programFileProblem(large)).toBe(ProgramFileProblem.TooLarge);
  });
});
