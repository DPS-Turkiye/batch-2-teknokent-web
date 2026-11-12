import { MentorLanguage, Weekday } from "@/interfaces/mentor";
import {
  PersonProgramRelation,
  type PersonSummary,
  type PersonSummaryAvailability,
} from "@/interfaces/person-summary";
import { ProgramMentorStatus, ProgramStatus } from "@/interfaces/program";
import { UserAccountStatus, UserRole } from "@/interfaces/session";

export function mentorSummary(
  overrides: Partial<PersonSummary> = {},
): PersonSummary {
  return {
    id: "mentor-1",
    fullName: "Deniz Yıldız",
    email: "deniz@example.test",
    role: UserRole.Mentor,
    status: UserAccountStatus.Approved,
    jobTitle: null,
    bio: null,
    linkedinUrl: "https://www.linkedin.com/in/example",
    expertise: [],
    createdAt: "2026-09-01T09:00:00Z",
    mentor: {
      professionalTitle: "Ürün lideri",
      company: "Örnek Şirket",
      about: "Erken aşama ekiplerle ürün keşfi üzerine çalışıyor.",
      experienceLevel: "10+ yıl",
      sectorExperience: "Fintech",
      startupStages: "MVP",
      specialties: ["Ürün stratejisi"],
      offerings: ["Ürün yol haritası"],
      languages: [MentorLanguage.Turkish, MentorLanguage.English],
      experiences: [
        {
          title: "Ürün Direktörü",
          organization: "Örnek Şirket",
          period: "2020 – bugün",
          summary: null,
        },
      ],
      educations: [
        { school: "Örnek Üniversitesi", degree: "MBA", period: null },
      ],
      menteeCapacity: 4,
      meetingMode: null,
      activeMenteeCount: 2,
      completedMentorshipCount: 5,
      availability: mentorAvailability(),
    },
    startup: null,
    programs: [
      {
        id: "program-1",
        name: "Yeşil Program",
        status: ProgramStatus.Active,
        relation: PersonProgramRelation.Mentor,
        mentorStatus: ProgramMentorStatus.Accepted,
      },
      {
        id: "program-2",
        name: "Mavi Program",
        status: ProgramStatus.Active,
        relation: PersonProgramRelation.Mentor,
        mentorStatus: ProgramMentorStatus.Pending,
      },
    ],
    ...overrides,
  };
}

export function menteeSummary(
  overrides: Partial<PersonSummary> = {},
): PersonSummary {
  return {
    id: "mentee-1",
    fullName: "Ece Kaya",
    email: "ece@example.test",
    role: UserRole.Mentee,
    status: UserAccountStatus.Pending,
    jobTitle: "Kurucu ortak",
    bio: "Yerel üreticileri alıcılarla buluşturuyor.",
    linkedinUrl: null,
    expertise: ["Satış"],
    createdAt: "2026-10-05T09:00:00Z",
    mentor: null,
    startup: {
      id: "startup-1",
      name: "Pazar Lab",
      description: "Yerel üreticiler için pazar yeri",
      website: "https://pazarlab.example.test",
      sector: "E-ticaret",
      maturity: null,
      problem: "Üreticiler alıcıya ulaşamıyor.",
      solution: null,
      fundingStage: null,
      foundedYear: 2025,
    },
    programs: [
      {
        id: "program-1",
        name: "Yeşil Program",
        status: ProgramStatus.Active,
        relation: PersonProgramRelation.Mentee,
        mentorStatus: null,
      },
    ],
    ...overrides,
  };
}

/** Two windows on Tuesday (out of order), one on Monday, a day off and a one-off slot. */
export function mentorAvailability(): PersonSummaryAvailability {
  return {
    weekly: [
      {
        dayOfWeek: Weekday.Tuesday,
        startTime: "14:00:00",
        endTime: "15:00:00",
      },
      {
        dayOfWeek: Weekday.Monday,
        startTime: "09:00:00",
        endTime: "10:00:00",
      },
      {
        dayOfWeek: Weekday.Tuesday,
        startTime: "10:00:00",
        endTime: "12:00:00",
      },
    ],
    daysOff: [{ startsOn: "2026-11-20", endsOn: "2026-11-22" }],
    extraSlots: [{ startsAt: "2026-11-14T09:00:00Z", durationMinutes: 45 }],
  };
}
