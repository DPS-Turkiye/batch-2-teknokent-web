import { describe, expect, it } from "vitest";

import {
  EMPTY_STUDENT_DRAFT,
  PLACEHOLDER_PARSED_PROFILE,
} from "@/interfaces/mentor-onboarding";
import {
  applyMentorCv,
  fillOnboardingProfile,
  fillStudies,
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
  studies: EMPTY_STUDENT_DRAFT,
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
      studies: EMPTY_STUDENT_DRAFT,
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

describe("student studies from a CV", () => {
  it("reads a student mentor's studies, and only a class year the form offers", () => {
    const studies = toMentorCvResult({
      department: " Bilgisayar Mühendisliği ",
      study_year: "3. sınıf",
      strong_courses: ["CENG 140", " ", "MATH 119"],
      student_projects: ["Kampüs uygulaması", "Robot yarışması"],
      exchange_experience: "TU Delft, 2025 güz",
    }).studies;

    expect(studies).toEqual({
      department: "Bilgisayar Mühendisliği",
      studyYear: "3. sınıf",
      courses: "CENG 140, MATH 119",
      projects: "Kampüs uygulaması\nRobot yarışması",
      erasmus: "TU Delft, 2025 güz",
    });
    expect(toMentorCvResult({ study_year: "Junior" }).studies.studyYear).toBe(
      "",
    );
  });

  const typed = { ...EMPTY_STUDENT_DRAFT, department: "Fizik", courses: "" };
  const found = {
    ...EMPTY_STUDENT_DRAFT,
    department: "Bilgisayar Mühendisliği",
    courses: "CENG 140",
  };

  it("keeps what the student typed at signup and fills the rest", () => {
    expect(fillStudies(typed, found)).toEqual({
      ...EMPTY_STUDENT_DRAFT,
      department: "Fizik",
      courses: "CENG 140",
    });
  });

  it("lets the CV win on the profile page, but not with an empty answer", () => {
    expect(fillStudies(typed, found, true)).toEqual({
      ...EMPTY_STUDENT_DRAFT,
      department: "Bilgisayar Mühendisliği",
      courses: "CENG 140",
    });
    expect(fillStudies(typed, EMPTY_STUDENT_DRAFT, true)).toEqual(typed);
  });
});
