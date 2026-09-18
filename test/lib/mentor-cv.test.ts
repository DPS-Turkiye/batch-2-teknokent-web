import { describe, expect, it } from "vitest";

import { PLACEHOLDER_PARSED_PROFILE } from "@/interfaces/mentor-onboarding";
import {
  applyMentorCv,
  fillOnboardingProfile,
  type MentorCvResult,
  toMentorCvResult,
} from "@/lib/mentor-cv";

const cv: MentorCvResult = {
  fullName: "Nihan Öztürk",
  title: "Head of Design",
  company: "Looply",
  about: "Ürün tasarımı ekiplerini büyüten biri.",
  experienceLevel: "12 yıl",
  sectorExperience: "SaaS, Fintech",
  specialties: ["UX", "Design Systems"],
  history: [
    {
      title: "Head of Design",
      organization: "Looply",
      period: "2021 – ",
      summary: "",
    },
    {
      title: "Senior Designer",
      organization: "Peak",
      period: "2016 – 2021",
      summary: "",
    },
  ],
};

describe("toMentorCvResult", () => {
  it("reads a mentor's CV into profile fields", () => {
    expect(
      toMentorCvResult({
        full_name: " Nihan Öztürk ",
        current_role: "Head of Design",
        current_company: "Looply",
        professional_summary: "Özet",
        years_of_experience: 12,
        industries: ["SaaS", " Fintech "],
        professional_functions: ["UX"],
        technologies: ["Figma"],
        work_history: [
          {
            title: "Head of Design",
            organization: "Looply",
            period: null,
            summary: null,
          },
          { title: "  ", organization: "Boş", period: null, summary: null },
        ],
      }),
    ).toEqual({
      fullName: "Nihan Öztürk",
      title: "Head of Design",
      company: "Looply",
      about: "Özet",
      experienceLevel: "12 yıl",
      sectorExperience: "SaaS, Fintech",
      specialties: ["UX", "Figma", "SaaS", "Fintech"],
      history: [
        {
          title: "Head of Design",
          organization: "Looply",
          period: "",
          summary: "",
        },
      ],
    });
  });

  it("falls back to the experience level and leaves out what is missing", () => {
    const result = toMentorCvResult({ experience_level: "Kıdemli" });
    expect(result.experienceLevel).toBe("Kıdemli");
    expect(result.company).toBe("");
    expect(result.history).toEqual([]);
  });
});

describe("applyMentorCv", () => {
  const form = {
    professionalTitle: "Mentor",
    company: "",
    about: "Eski",
    experienceLevel: "",
    sectorExperience: "B2C",
    specialties: ["UX"],
    experiences: [
      {
        title: "head of design",
        organization: "looply",
        period: "",
        summary: "",
      },
    ],
    menteeCapacity: 3,
  };

  it("replaces the text fields but only adds topics and new roles", () => {
    const next = applyMentorCv(form, cv, 10);

    expect(next).toMatchObject({
      professionalTitle: "Head of Design",
      company: "Looply",
      about: "Ürün tasarımı ekiplerini büyüten biri.",
      experienceLevel: "12 yıl",
      sectorExperience: "SaaS, Fintech",
      specialties: ["UX", "Design Systems"],
      menteeCapacity: 3,
    });
    expect(next.experiences.map((role) => role.title)).toEqual([
      "head of design",
      "Senior Designer",
    ]);
  });

  it("keeps a field the CV says nothing about, and stays within the role limit", () => {
    const next = applyMentorCv(form, { ...cv, company: "", about: "" }, 1);
    expect(next.about).toBe("Eski");
    expect(next.company).toBe("");
    expect(next.experiences).toHaveLength(1);
  });
});

describe("fillOnboardingProfile", () => {
  it("fills what the applicant has not typed and offers the CV's areas", () => {
    const next = fillOnboardingProfile(
      { ...PLACEHOLDER_PARSED_PROFILE, title: "Kurucu", inferredAreas: ["UX"] },
      cv,
    );

    expect(next).toEqual({
      fullName: "Nihan Öztürk",
      title: "Kurucu",
      company: "Looply",
      totalExperience: "12 yıl",
      history: cv.history,
      inferredAreas: ["UX", "Design Systems"],
    });
  });
});
