import { describe, expect, it } from "vitest";

import {
  blankWizardPhase,
  curriculumError,
  joinOutputs,
  missingDate,
  monthSpan,
  outputTokens,
  phaseDateRange,
  proposedPhases,
  reorderPhases,
  timelineSegments,
  type WizardPhase,
} from "@/lib/program-phases";

const phase = (patch: Partial<WizardPhase>): WizardPhase => ({
  ...blankWizardPhase(),
  ...patch,
});

describe("program phases", () => {
  it("marks phases read from the syllabus and caps them at twelve", () => {
    const proposals = Array.from({ length: 14 }, (_, n) => ({
      name: `Faz ${n + 1}`,
      expectedOutput: null,
      startDate: null,
      endDate: null,
    }));

    const phases = proposedPhases(proposals);

    expect(phases).toHaveLength(12);
    expect(phases.every((row) => row.fromFile)).toBe(true);
    expect(new Set(phases.map((row) => row.key)).size).toBe(12);
  });

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

  it("asks for a name first, then dates on phases read from the file", () => {
    expect(curriculumError([])).toBeNull();
    expect(curriculumError([phase({ name: " " })])).toBe("1. fazın adını gir.");
    expect(curriculumError([phase({ name: "Keşif" })])).toBeNull();
    expect(curriculumError([phase({ name: "Demo Day", fromFile: true })])).toBe(
      "“Demo Day” fazının tarihlerini gir.",
    );
    expect(
      curriculumError([
        phase({ name: "MVP", startDate: "2027-02-01", endDate: "2027-01-01" }),
      ]),
    ).toBe("“MVP” fazı başlamadan bitemez.");
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
