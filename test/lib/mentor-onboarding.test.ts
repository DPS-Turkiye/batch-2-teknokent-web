import { describe, expect, it } from "vitest";

import { MeetingFrequency, Weekday } from "@/interfaces/mentor";
import {
  EMPTY_STUDENT_DRAFT,
  emptyWeek,
  PLACEHOLDER_PARSED_PROFILE,
  type MentorOnboardingDraft,
} from "@/interfaces/mentor-onboarding";
import { withKeys } from "@/lib/keyed-list";
import {
  invalidDays,
  openDays,
  toAvailabilityPayload,
  toMentorProfilePayload,
  weeklyCapacity,
  weekSummary,
} from "@/lib/mentor-onboarding";

function draft(
  overrides: Partial<MentorOnboardingDraft> = {},
): MentorOnboardingDraft {
  const week = emptyWeek();
  week[Weekday.Tuesday] = { enabled: true, start: "14:00", end: "17:00" };
  week[Weekday.Friday] = { enabled: true, start: "09:30", end: "11:00" };
  return {
    firstName: "Nihan",
    lastName: "Öztürk",
    linkedin: "",
    about: "  On yıllık ürün deneyimi. ",
    photo: null,
    cv: null,
    cvStoredName: null,
    programIds: [],
    profile: {
      ...PLACEHOLDER_PARSED_PROFILE,
      title: " Ürün Direktörü ",
      company: "Peak",
      totalExperience: "9 yıl",
      history: withKeys([
        {
          title: "Senior PM",
          organization: "Looply",
          period: "2019 – 2023",
          summary: "",
        },
        { title: "  ", organization: "Boş satır" },
      ]),
    },
    topics: ["Finans", "Satış"],
    stages: ["Fikir", "MVP"],
    offerings: ["Pitch deck incelemesi"],
    student: { ...EMPTY_STUDENT_DRAFT },
    week,
    capacity: 3,
    durationMinutes: 45,
    bufferMinutes: 15,
    frequency: MeetingFrequency.Biweekly,
    format: "Online",
    responseTime: "1–2 gün",
    consent: true,
    ...overrides,
  };
}

describe("mentor onboarding helpers", () => {
  it("lists open days in week order and summarises them", () => {
    const value = draft();

    expect(openDays(value.week)).toEqual([Weekday.Tuesday, Weekday.Friday]);
    expect(weekSummary(value.week)).toBe("Sal 14–17 · Cum 9.30–11");
  });

  it("flags an open day whose end is not after its start", () => {
    const value = draft();
    value.week[Weekday.Monday] = {
      enabled: true,
      start: "12:00",
      end: "12:00",
    };

    expect(invalidDays(value.week)).toEqual([Weekday.Monday]);
  });

  it("works out the weekly hours and how many meetings fit with the buffer", () => {
    // Tuesday 180 min fits 3 × (45 + 15); Friday 90 min fits 1.
    expect(weeklyCapacity(draft())).toEqual({ hours: 4.5, meetings: 4 });
  });

  it("sends a student mentor's studies as lists, and nothing for other mentors", () => {
    const student = {
      ...draft(),
      student: {
        department: " Bilgisayar Mühendisliği ",
        studyYear: "4. sınıf",
        courses: "CENG 140, MATH 119 ,, ",
        projects: "Kampüs uygulaması\n\n  Robot takımı ",
        erasmus: "  ",
      },
    };

    expect(toMentorProfilePayload(student, true).studentProfile).toEqual({
      department: "Bilgisayar Mühendisliği",
      studyYear: "4. sınıf",
      strongCourses: ["CENG 140", "MATH 119"],
      projects: ["Kampüs uygulaması", "Robot takımı"],
      erasmus: null,
    });
    expect(toMentorProfilePayload(student)).not.toHaveProperty(
      "studentProfile",
    );
  });

  it("sends the typed schools, trimmed, and drops one without a name", () => {
    const base = draft();
    const payload = toMentorProfilePayload({
      ...base,
      profile: {
        ...base.profile,
        education: withKeys([
          { school: " ODTÜ ", degree: " Lisans ", period: "2022 – 2026" },
          { school: " ", degree: "Lise", period: "" },
        ]),
      },
    });
    expect(payload.educations).toEqual([
      { school: "ODTÜ", degree: "Lisans", period: "2022 – 2026" },
    ]);
  });

  it("builds the mentor profile payload, dropping empty roles and trimming text", () => {
    const payload = toMentorProfilePayload(draft());

    expect(payload).toMatchObject({
      professionalTitle: "Ürün Direktörü",
      company: "Peak",
      experienceLevel: "9 yıl",
      startupStages: "Fikir, MVP",
      specialties: ["Finans", "Satış"],
      menteeCapacity: 3,
      about: "On yıllık ürün deneyimi.",
      meetingFrequency: MeetingFrequency.Biweekly,
      offerings: ["Pitch deck incelemesi"],
    });
    expect(payload.experiences).toEqual([
      {
        title: "Senior PM",
        organization: "Looply",
        period: "2019 – 2023",
        summary: "",
      },
    ]);
  });

  it("builds one availability rule per open day with the chosen meeting length", () => {
    const payload = toAvailabilityPayload(draft());

    expect(payload.rules).toEqual([
      {
        dayOfWeek: Weekday.Tuesday,
        startTime: "14:00",
        endTime: "17:00",
        slotMinutes: 45,
      },
      {
        dayOfWeek: Weekday.Friday,
        startTime: "09:30",
        endTime: "11:00",
        slotMinutes: 45,
      },
    ]);
    expect(payload).toMatchObject({
      exceptions: [],
      menteeCapacity: 3,
      defaultMeetingDurationMinutes: 45,
      meetingBufferMinutes: 15,
    });
  });
});
