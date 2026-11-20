import { describe, expect, it } from "vitest";

import {
  clipText,
  MENTOR_PROFILE_LIMITS,
  MentorProfileProblemKind,
  mentorProfileProblems,
  mentorTextFieldLimit,
  onScreenPath,
  parseMentorFieldPath,
  showsCharacterCount,
} from "@/lib/mentor-profile-limits";

// Made-up working-style text, as long as the one the backend refused (414 characters).
const LONG_STYLE =
  "Haftalık kısa görüşmelerle ilerlerim, her görüşmeden önce gündemi birlikte belirleriz. "
    .repeat(5)
    .slice(0, 414);

const form = {
  professionalTitle: "Ürün Danışmanı",
  company: "Looply",
  availabilityLabel: "",
  responseTimeLabel: "",
  meetingMode: "",
  communicationPreference: "",
  mentoringStyle: "",
  fitLabel: "",
  experienceLevel: "10 yıl",
  sectorExperience: "",
  startupStages: "Seed",
  about: "",
  specialties: [],
  experiences: [],
  educations: [],
  programRoles: [],
};

const role = (summary: string) => ({
  title: "CTO",
  organization: "Looply",
  period: "2020 – 2024",
  summary,
});

describe("mentorProfileProblems", () => {
  it("finds nothing wrong in a complete profile within the limits", () => {
    expect(
      mentorProfileProblems({
        ...form,
        mentoringStyle: "s".repeat(200),
        about: "a".repeat(4000),
        experiences: [role("x".repeat(300))],
      }),
    ).toEqual([]);
  });

  it("names a working style longer than the backend's 200", () => {
    expect(
      mentorProfileProblems({ ...form, mentoringStyle: LONG_STYLE }),
    ).toEqual([
      {
        kind: MentorProfileProblemKind.TooLong,
        path: { field: "mentoringStyle", index: null, part: null },
        max: 200,
        length: 414,
      },
    ]);
  });

  it("names every blank field the backend requires", () => {
    const problems = mentorProfileProblems({
      ...form,
      professionalTitle: " ",
      experienceLevel: "",
      startupStages: "",
    });
    expect(problems.map((problem) => problem.path.field)).toEqual([
      "professionalTitle",
      "experienceLevel",
      "startupStages",
    ]);
    expect(
      problems.every(
        (problem) => problem.kind === MentorProfileProblemKind.Required,
      ),
    ).toBe(true);
  });

  it("numbers past roles as the page shows them, skipping empty rows", () => {
    const blank = { title: "", organization: "", period: "", summary: "" };
    const problems = mentorProfileProblems({
      ...form,
      about: "a".repeat(4001),
      experiences: [blank, role("x".repeat(301))],
      educations: [{ school: "ODTÜ", degree: "", period: "p".repeat(101) }],
    });
    expect(problems.map((problem) => problem.path)).toEqual([
      { field: "about", index: null, part: null },
      { field: "experiences", index: 1, part: "summary" },
      { field: "educations", index: 0, part: "period" },
    ]);
  });

  it("checks topics against their column and program roles against 80", () => {
    expect(
      mentorProfileProblems({
        ...form,
        specialties: ["UX", "t".repeat(256)],
        programRoles: [{ role: "Mentor" }, { role: "r".repeat(81) }],
      }).map((problem) => problem.path),
    ).toEqual([
      { field: "specialties", index: 1, part: null },
      { field: "programRoles", index: 1, part: "role" },
    ]);
  });

  it("checks a student mentor's studies item by item", () => {
    const problems = mentorProfileProblems(form, {
      department: "d".repeat(256),
      studyYear: "",
      courses: `CENG 140, ${"c".repeat(256)}`,
      projects: `Robot\n${"p".repeat(501)}`,
      erasmus: "e".repeat(501),
    });
    expect(problems.map((problem) => problem.path)).toEqual([
      { field: "studentProfile", index: null, part: "department" },
      { field: "studentProfile", index: null, part: "erasmus" },
      { field: "studentProfile", index: 1, part: "strongCourses" },
      { field: "studentProfile", index: 1, part: "projects" },
    ]);
  });

  it("refuses more than ten courses", () => {
    const courses = Array.from({ length: 11 }, (_, n) => `DERS ${n}`);
    expect(
      mentorProfileProblems(form, {
        department: "",
        studyYear: "",
        courses: courses.join(", "),
        projects: "",
        erasmus: "",
      }),
    ).toEqual([
      {
        kind: MentorProfileProblemKind.TooMany,
        path: { field: "studentProfile", index: null, part: "strongCourses" },
        max: 10,
      },
    ]);
  });
});

describe("onScreenPath", () => {
  const blank = { title: "", organization: "", period: "", summary: "" };
  const rows = {
    experiences: [blank, { ...blank, title: "CTO" }],
    educations: [
      { school: "", degree: "", period: "" },
      { school: "", degree: "", period: "" },
      { school: "ODTÜ", degree: "", period: "" },
    ],
  };

  it("turns a sent row number back into its place on the page", () => {
    expect(
      onScreenPath({ field: "experiences", index: 0, part: "summary" }, rows),
    ).toEqual({ field: "experiences", index: 1, part: "summary" });
    expect(
      onScreenPath({ field: "educations", index: 0, part: "school" }, rows),
    ).toEqual({ field: "educations", index: 2, part: "school" });
  });

  it("leaves other paths alone", () => {
    const style = { field: "mentoringStyle", index: null, part: null };
    expect(onScreenPath(style, rows)).toBe(style);
    const topic = { field: "specialties", index: 3, part: null };
    expect(onScreenPath(topic, rows)).toEqual(topic);
  });
});

describe("parseMentorFieldPath", () => {
  it("reads the keys the backend's fieldErrors use", () => {
    expect(parseMentorFieldPath("mentoringStyle")).toEqual({
      field: "mentoringStyle",
      index: null,
      part: null,
    });
    expect(parseMentorFieldPath("experiences[2].summary")).toEqual({
      field: "experiences",
      index: 2,
      part: "summary",
    });
    expect(parseMentorFieldPath("specialties[0]")).toEqual({
      field: "specialties",
      index: 0,
      part: null,
    });
    expect(parseMentorFieldPath("studentProfile.projects[1]")).toEqual({
      field: "studentProfile",
      index: null,
      part: "projects",
    });
    expect(parseMentorFieldPath("programRoles[0].role")).toEqual({
      field: "programRoles",
      index: 0,
      part: "role",
    });
    expect(parseMentorFieldPath("[0]")).toBeNull();
    expect(parseMentorFieldPath("a.b.c")).toBeNull();
  });
});

describe("clipText", () => {
  it("leaves text within the limit alone", () => {
    expect(clipText("Kısa", 300)).toBe("Kısa");
    expect(clipText("x".repeat(300), 300)).toHaveLength(300);
  });

  it("cuts on a whole word and marks the cut", () => {
    const clipped = clipText("kelime ".repeat(60), 300);
    expect(clipped.length).toBeLessThanOrEqual(300);
    expect(clipped.endsWith("kelime…")).toBe(true);
  });

  it("has room for nothing but the mark at the smallest limits", () => {
    expect(clipText("abc", 1)).toBe("…");
    expect(clipText("abc", 0)).toBe("");
  });

  it("cuts one long word at the limit", () => {
    expect(clipText("x".repeat(400), 100)).toBe(`${"x".repeat(99)}…`);
  });

  it("never leaves half an emoji", () => {
    // The 99th code unit is the first half of the rocket, so the whole rocket goes.
    const clipped = clipText(`${"x".repeat(98)}🚀🚀`, 100);
    expect(clipped).toBe(`${"x".repeat(98)}…`);
    expect(clipped.length).toBeLessThanOrEqual(100);
  });
});

describe("limits and counters", () => {
  it("caps every text field at 200 but the about text at 4000", () => {
    expect(mentorTextFieldLimit("mentoringStyle")).toBe(
      MENTOR_PROFILE_LIMITS.text,
    );
    expect(mentorTextFieldLimit("about")).toBe(4000);
  });

  it("shows a count near the limit, or always when asked", () => {
    expect(showsCharacterCount(159, 200)).toBe(false);
    expect(showsCharacterCount(160, 200)).toBe(true);
    expect(showsCharacterCount(0, 300, true)).toBe(true);
  });
});
