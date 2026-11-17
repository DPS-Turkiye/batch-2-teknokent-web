import { describe, expect, it } from "vitest";

import { ProgramStatus } from "@/interfaces/program";
import {
  MentorPageAccess,
  mentorPageAccess,
  sharedProgramNames,
} from "@/lib/mentor-access";
import { mentorProfile } from "@test/fixtures/mentors";

const inSudesProgram = {
  ...mentorProfile,
  programs: [
    {
      id: "p-sude",
      name: "Sude Hızlandırma",
      status: ProgramStatus.Active,
      role: null,
    },
    {
      id: "p-other",
      name: "Başka Program",
      status: ProgramStatus.Active,
      role: null,
    },
  ],
};

describe("mentorPageAccess", () => {
  it("lets the viewer send a request to a mentor of their active program", () => {
    expect(
      mentorPageAccess({
        reachable: true,
        mentor: inSudesProgram,
        viewerProgramIds: [],
      }),
    ).toBe(MentorPageAccess.Request);
  });

  it("shows a mentor from another of the viewer's programs without the request", () => {
    expect(
      mentorPageAccess({
        reachable: false,
        mentor: inSudesProgram,
        viewerProgramIds: ["p-active", "p-sude"],
      }),
    ).toBe(MentorPageAccess.ViewOnly);
    expect(sharedProgramNames(inSudesProgram, ["p-active", "p-sude"])).toEqual([
      "Sude Hızlandırma",
    ]);
  });

  it("hides a mentor who shares no program with the viewer, or who is missing", () => {
    expect(
      mentorPageAccess({
        reachable: false,
        mentor: inSudesProgram,
        viewerProgramIds: ["p-active"],
      }),
    ).toBe(MentorPageAccess.Hidden);
    expect(
      mentorPageAccess({
        reachable: false,
        mentor: { ...inSudesProgram, programs: [] },
        viewerProgramIds: ["p-sude"],
      }),
    ).toBe(MentorPageAccess.Hidden);
    expect(
      mentorPageAccess({
        reachable: false,
        mentor: null,
        viewerProgramIds: ["p-sude"],
      }),
    ).toBe(MentorPageAccess.Hidden);
  });
});
