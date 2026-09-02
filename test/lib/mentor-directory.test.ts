import { describe, expect, it } from "vitest";

import {
  applyMentorDirectory,
  DEFAULT_MENTOR_FILTERS,
  filterMentors,
  mentorExpertiseLabel,
} from "@/lib/mentor-directory";
import { mentorProfile } from "@test/fixtures/mentors";

const secondMentor = {
  ...mentorProfile,
  id: "mentor-2",
  fullName: "Leyla Aksoy",
  company: "Peak Games",
  professionalTitle: "Growth Lead",
  specialties: ["Büyüme", "Pazarlama"],
  sectorExperience: "Oyun",
  availabilityLabel: "Gelecek hafta müsait",
  startupStages: "Series A",
};

describe("filterMentors", () => {
  const mentors = [mentorProfile, secondMentor];

  it("returns everyone when the query is empty", () => {
    expect(filterMentors(mentors, "  ")).toEqual(mentors);
  });

  it("matches name, company, and specialty without ascii folding", () => {
    expect(filterMentors(mentors, "kemal").map((mentor) => mentor.id)).toEqual([
      mentorProfile.id,
    ]);
    expect(filterMentors(mentors, "peak").map((mentor) => mentor.id)).toEqual([
      "mentor-2",
    ]);
    expect(
      filterMentors(mentors, "kullanıcı araştırması").map(
        (mentor) => mentor.id,
      ),
    ).toEqual([mentorProfile.id]);
  });

  it("treats Turkish i correctly", () => {
    expect(filterMentors(mentors, "BÜYÜME")).toEqual([secondMentor]);
  });
});

describe("applyMentorDirectory", () => {
  const mentors = [mentorProfile, secondMentor];

  it("filters by specialty and availability from the live profile fields", () => {
    expect(
      applyMentorDirectory(mentors, {
        ...DEFAULT_MENTOR_FILTERS,
        specialty: "Büyüme",
      }).map((mentor) => mentor.id),
    ).toEqual(["mentor-2"]);
    expect(
      applyMentorDirectory(mentors, {
        ...DEFAULT_MENTOR_FILTERS,
        availability: "Bu hafta müsait",
      }).map((mentor) => mentor.id),
    ).toEqual([mentorProfile.id]);
  });

  it("sorts by name when asked", () => {
    expect(
      applyMentorDirectory(mentors, {
        ...DEFAULT_MENTOR_FILTERS,
        sort: "name",
      }).map((mentor) => mentor.fullName),
    ).toEqual(["Dr. Kemal Arslan", "Leyla Aksoy"]);
  });
});

describe("mentorExpertiseLabel", () => {
  it("joins the first specialties for the row subtitle", () => {
    expect(mentorExpertiseLabel(mentorProfile)).toBe(
      "Kullanıcı araştırması & MVP testi",
    );
  });
});
