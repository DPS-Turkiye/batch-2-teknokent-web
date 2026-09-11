import { describe, expect, it } from "vitest";

import {
  experienceDetail,
  experienceHeading,
  menteeLoadLabel,
} from "@/lib/mentor-detail";
import { mentorProfile } from "@test/fixtures/mentors";

describe("mentor detail helpers", () => {
  it("shows the mentee load against capacity when there is one", () => {
    expect(
      menteeLoadLabel({
        ...mentorProfile,
        activeMenteeCount: 4,
        menteeCapacity: 6,
      }),
    ).toBe("4 / 6");
    expect(
      menteeLoadLabel({
        ...mentorProfile,
        activeMenteeCount: 4,
        menteeCapacity: null,
      }),
    ).toBe("4");
    expect(menteeLoadLabel(mentorProfile)).toBeNull();
  });

  it("joins only the parts of a past role that are filled in", () => {
    const role = {
      title: "Head of Product Design",
      organization: "Looply",
      period: "2022–2026",
      summary: null,
    };

    expect(experienceHeading(role)).toBe("Head of Product Design · Looply");
    expect(experienceDetail(role)).toBe("2022–2026");
    expect(experienceHeading({ ...role, organization: null })).toBe(
      "Head of Product Design",
    );
  });
});
