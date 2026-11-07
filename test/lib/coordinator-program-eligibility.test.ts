import { describe, expect, it } from "vitest";

import {
  detailsInput,
  parseEmailList,
  settingsDraftOf,
} from "@/lib/coordinator-program-detail";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";

describe("parseEmailList", () => {
  it("splits a paste on lines, commas, semicolons and spaces", () => {
    expect(
      parseEmailList(
        " a@metu.edu.tr\nb@metu.edu.tr, c@metu.edu.tr;d@metu.edu.tr  \n\n",
      ),
    ).toEqual([
      "a@metu.edu.tr",
      "b@metu.edu.tr",
      "c@metu.edu.tr",
      "d@metu.edu.tr",
    ]);
  });

  it("is empty for a blank paste", () => {
    expect(parseEmailList("  \n ")).toEqual([]);
  });
});

describe("detailsInput eligibility", () => {
  it("sends an empty domain to clear it, and the two switches as set", () => {
    const draft = settingsDraftOf(coordinatorProgramDetail());

    expect(detailsInput(draft)).toMatchObject({
      eligibleEmailDomain: "",
      rosterOnly: false,
      individualMentees: false,
    });
    expect(
      detailsInput({
        ...draft,
        eligibleEmailDomain: " metu.edu.tr ",
        rosterOnly: true,
        individualMentees: true,
      }),
    ).toMatchObject({
      eligibleEmailDomain: "metu.edu.tr",
      rosterOnly: true,
      individualMentees: true,
    });
  });
});
