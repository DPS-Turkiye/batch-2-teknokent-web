import { describe, expect, it } from "vitest";
import {
  editableProfile,
  profilePayload,
  toProfileObject,
} from "@/lib/profile-analysis";
import { ProfileAnalysisType } from "@/interfaces/profile-analysis";

describe("extracted profile review data", () => {
  it("keeps unedited matching evidence while removing suggestions the user rejected", () => {
    const original = {
      technologies: ["Java", "React"],
      support_needs: ["Sales"],
      technology_inferences: [{ tag: "Java" }, { tag: "React" }],
      custom_evidence: { source: "pitch" },
    };
    const draft = editableProfile(original, ProfileAnalysisType.Startup);
    draft.technologies = " Java, PostgreSQL, ";
    expect(
      profilePayload(original, draft, ProfileAnalysisType.Startup),
    ).toMatchObject({
      technologies: ["Java", "PostgreSQL"],
      technology_inferences: [{ tag: "Java" }],
      support_needs: ["Sales"],
      custom_evidence: { source: "pitch" },
    });
  });
  it.each(["invalid", "[]", "null", "42"])(
    "handles a malformed or non-object saved profile: %s",
    (input) => {
      expect(toProfileObject(input)).toEqual({});
    },
  );
});
