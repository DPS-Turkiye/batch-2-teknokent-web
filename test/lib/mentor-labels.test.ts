import { describe, expect, it } from "vitest";

import { MentorLabelColor, type MentorLabel } from "@/interfaces/mentor-label";
import {
  carriedLabels,
  knownLabelIds,
  labelsOfMentor,
  mentorLabelIds,
  MentorLabelNameProblem,
  mentorLabelNameProblem,
  normalizeMentorLabelName,
  toggleMentorLabel,
  withAllLabels,
} from "@/lib/mentor-labels";

const fintech: MentorLabel = {
  id: "fintech",
  name: "Fintech",
  color: MentorLabelColor.Green,
};
const ai: MentorLabel = { id: "ai", name: "AI", color: MentorLabelColor.Teal };
const health: MentorLabel = {
  id: "health",
  name: "Sağlık",
  color: MentorLabelColor.Red,
};
const LABELS = [ai, fintech, health];
const ASSIGNMENTS = [
  { mentorId: "ayse", labelIds: ["ai", "fintech"] },
  { mentorId: "can", labelIds: ["fintech"] },
];

describe("mentor label names", () => {
  it("trims, collapses every kind of space and drops invisible characters", () => {
    expect(normalizeMentorLabelName("  Yapay   zekâ ")).toBe("Yapay zekâ");
    expect(normalizeMentorLabelName("Fin\u200Btech\u00A0\u00A0AI\t")).toBe(
      "Fintech AI",
    );
    expect(normalizeMentorLabelName("Fin\uFEFFtech")).toBe("Fintech");
    expect(mentorLabelNameProblem("\u200B\u202E", [])).toBe(
      MentorLabelNameProblem.Required,
    );
  });

  it("accepts 30 characters and refuses 31, counting what a person sees", () => {
    expect(mentorLabelNameProblem("a".repeat(30), [])).toBeNull();
    expect(mentorLabelNameProblem("a".repeat(31), [])).toBe(
      MentorLabelNameProblem.TooLong,
    );
    expect(mentorLabelNameProblem("ğ".repeat(30), [])).toBeNull();
  });

  it("refuses an empty name and a name taken in any case, except the label's own", () => {
    expect(mentorLabelNameProblem("   ", LABELS)).toBe(
      MentorLabelNameProblem.Required,
    );
    expect(mentorLabelNameProblem(" fintech ", LABELS)).toBe(
      MentorLabelNameProblem.Taken,
    );
    expect(mentorLabelNameProblem("FINTECH", LABELS, "fintech")).toBeNull();
  });
});

describe("mentor label assignments", () => {
  it("finds a mentor's labels in the list's order, and none for an unknown mentor", () => {
    expect(mentorLabelIds(ASSIGNMENTS, "ayse")).toEqual(["ai", "fintech"]);
    expect(labelsOfMentor(LABELS, ASSIGNMENTS, "ayse")).toEqual([ai, fintech]);
    expect(labelsOfMentor(LABELS, ASSIGNMENTS, "deniz")).toEqual([]);
  });

  it("offers only labels someone carries", () => {
    expect(carriedLabels(LABELS, ASSIGNMENTS)).toEqual([ai, fintech]);
  });

  it("keeps the mentors who carry every selected label", () => {
    const mentors = [{ id: "ayse" }, { id: "can" }, { id: "deniz" }];
    const id = (mentor: { id: string }) => mentor.id;

    expect(withAllLabels(mentors, id, ASSIGNMENTS, [])).toEqual(mentors);
    expect(withAllLabels(mentors, id, ASSIGNMENTS, ["fintech"])).toEqual([
      { id: "ayse" },
      { id: "can" },
    ]);
    expect(withAllLabels(mentors, id, ASSIGNMENTS, ["fintech", "ai"])).toEqual([
      { id: "ayse" },
    ]);
    expect(withAllLabels(mentors, id, ASSIGNMENTS, ["health"])).toEqual([]);
  });

  it("leaves out a row without a mentor once a label is selected", () => {
    const rows = [{ mentorId: null }, { mentorId: "can" }];

    expect(
      withAllLabels(rows, (row) => row.mentorId, ASSIGNMENTS, ["fintech"]),
    ).toEqual([{ mentorId: "can" }]);
  });

  it("toggles a label and stops adding at the limit", () => {
    expect(toggleMentorLabel(["ai"], "ai")).toEqual([]);
    expect(toggleMentorLabel(["ai"], "fintech")).toEqual(["ai", "fintech"]);
    expect(toggleMentorLabel(["1", "2", "3", "4", "5"], "6")).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
    ]);
    expect(toggleMentorLabel(["1", "2"], "3", 2)).toEqual(["1", "2"]);
  });

  it("drops ids of labels that no longer exist", () => {
    expect(knownLabelIds(["ai", "gone"], LABELS)).toEqual(["ai"]);
  });
});
