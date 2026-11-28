import { describe, expect, it } from "vitest";

import { isMentorProfile } from "@/lib/mentors";
import { mentorProfile } from "@test/fixtures/mentors";

describe("isMentorProfile", () => {
  it("validates a complete mentor profile", () => {
    expect(isMentorProfile(mentorProfile)).toBe(true);
    expect(isMentorProfile({ ...mentorProfile, specialties: null })).toBe(
      false,
    );
  });
});
