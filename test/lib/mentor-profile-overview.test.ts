import { describe, expect, it } from "vitest";

import { type MeetingItem, MeetingStatus } from "@/interfaces/meeting";
import {
  MeetingFrequency,
  MentorLanguage,
  type MentorProfile,
  PrepFileRequirement,
  Weekday,
  WEEKDAY_LABELS,
} from "@/interfaces/mentor";
import {
  type MentorshipRequest,
  MentorshipRequestStatus,
} from "@/interfaces/mentorship-request";
import { ProgramStatus } from "@/interfaces/program";
import {
  completedSessionCount,
  languagesLabel,
  meetingPreferenceRows,
  mentorshipDurationLabel,
  mentorshipHistory,
  ratingLabel,
  programDetail,
  profileSubtitle,
  weeklyAvailabilityRows,
  workingStyleBullets,
} from "@/lib/mentor-profile-overview";

function profile(overrides: Partial<MentorProfile> = {}): MentorProfile {
  return {
    id: "mentor-1",
    fullName: "Nihan Öztürk",
    email: "nihan@teknokent.demo",
    initials: "NÖ",
    professionalTitle: "Design / UX Mentor",
    company: "",
    availabilityLabel: "Mentorluğa açık",
    responseTimeLabel: "~48 saat",
    meetingMode: "Online",
    communicationPreference: "",
    mentoringStyle: "",
    fitLabel: "",
    experienceLevel: "12 yıl",
    sectorExperience: "",
    startupStages: "",
    specialties: [],
    recommendationReasons: [],
    recommendationEvidence: [],
    ...overrides,
  };
}

function request(id: string, createdAt: string): MentorshipRequest {
  return {
    id,
    createdAt,
    organizationId: "org-1",
    organizationName: "NovaTech",
    requesterName: "Zeynep Er",
    mentorId: "mentor-1",
    supportArea: "Product Design",
    status: MentorshipRequestStatus.Accepted,
  } as MentorshipRequest;
}

function meeting(
  id: string,
  scheduledAt: string,
  status: MeetingStatus,
  mentorshipRequestId = "r1",
): MeetingItem {
  return {
    id,
    organizationId: "org-1",
    mentorshipRequestId,
    scheduledAt,
    durationMinutes: 45,
    status,
  };
}

describe("profileSubtitle", () => {
  it("joins the title, company and experience that are filled in", () => {
    expect(profileSubtitle(profile())).toBe("Design / UX Mentor · 12 yıl");
  });
});

describe("mentorshipDurationLabel", () => {
  const now = new Date("2026-09-15T12:00:00Z");

  it("counts months, then years, from the first accepted mentorship", () => {
    expect(
      mentorshipDurationLabel(
        [
          request("a", "2026-01-20T09:00:00Z"),
          request("b", "2024-09-10T09:00:00Z"),
        ],
        now,
      ),
    ).toBe("2 yıl");
    expect(
      mentorshipDurationLabel([request("a", "2026-01-20T09:00:00Z")], now),
    ).toBe("7 ay");
    expect(
      mentorshipDurationLabel([request("a", "2026-09-02T09:00:00Z")], now),
    ).toBe("1 aydan az");
  });

  it("has nothing to show without a mentorship", () => {
    expect(mentorshipDurationLabel([], now)).toBeNull();
  });

  it("does not count a month until its day has come round", () => {
    expect(
      mentorshipDurationLabel(
        [request("a", "2026-08-31T09:00:00Z")],
        new Date("2026-09-01T12:00:00Z"),
      ),
    ).toBe("1 aydan az");
    expect(
      mentorshipDurationLabel(
        [request("a", "2026-08-10T09:00:00Z")],
        new Date("2026-09-10T12:00:00Z"),
      ),
    ).toBe("1 ay");
  });
});

describe("mentorshipHistory", () => {
  it("shows each mentorship's period and completed sessions only", () => {
    const meetings = [
      meeting("m1", "2026-04-14T10:00:00Z", MeetingStatus.Completed),
      meeting("m2", "2026-06-12T10:00:00Z", MeetingStatus.Completed),
      meeting("m3", "2026-07-12T10:00:00Z", MeetingStatus.Scheduled),
      meeting("m4", "2026-05-12T10:00:00Z", MeetingStatus.Completed, "other"),
    ];

    expect(completedSessionCount(meetings)).toBe(3);
    expect(
      mentorshipHistory([request("r1", "2026-03-10T09:00:00Z")], meetings),
    ).toEqual([
      {
        id: "r1",
        title: "NovaTech · Zeynep Er",
        detail: "Mar – Haz 2026 · 2 seans",
        rating: null,
      },
    ]);
    expect(
      mentorshipHistory([request("r1", "2026-03-10T09:00:00Z")], meetings, {
        r1: 4.25,
      })[0].rating,
    ).toBe("4,3");
  });

  it("names both years across a new year, and one month when it has just begun", () => {
    expect(
      mentorshipHistory(
        [request("r1", "2025-11-10T09:00:00Z")],
        [meeting("m1", "2026-02-12T10:00:00Z", MeetingStatus.Completed)],
      )[0].detail,
    ).toBe("Kas 2025 – Şub 2026 · 1 seans");
    expect(
      mentorshipHistory([request("r1", "2026-09-10T09:00:00Z")], [])[0].detail,
    ).toBe("Eyl 2026 · 0 seans");
  });
});

describe("workingStyleBullets", () => {
  it("splits the working style into lines and adds sector and stages", () => {
    expect(
      workingStyleBullets(
        profile({
          mentoringStyle:
            "Her mentorluk 5 aşamada ilerler\n• Görüşme öncesi kısa bir dosya isterim\n",
          sectorExperience: "B2C SaaS",
        }),
      ),
    ).toEqual([
      "Her mentorluk 5 aşamada ilerler",
      "Görüşme öncesi kısa bir dosya isterim",
      "Sektör deneyimi: B2C SaaS",
    ]);
  });
});

describe("meetingPreferenceRows", () => {
  const settings = {
    rules: [],
    exceptions: [],
    menteeCapacity: 5,
    defaultMeetingDurationMinutes: 45,
    meetingBufferMinutes: 15,
  };

  it("shows the design's four rows in order", () => {
    expect(
      meetingPreferenceRows(
        profile({
          meetingFrequency: MeetingFrequency.Biweekly,
          prepFileRequirement: PrepFileRequirement.Required,
        }),
        settings,
      ),
    ).toEqual([
      { label: "Varsayılan süre", value: "45 dk" },
      { label: "Format", value: "Online" },
      { label: "Görüşme sıklığı", value: "2 haftada 1" },
      { label: "Ön hazırlık dosyası", value: "Zorunlu" },
    ]);
  });

  it("leaves out whatever is not set yet", () => {
    expect(meetingPreferenceRows(profile(), undefined)).toEqual([
      { label: "Format", value: "Online" },
    ]);
  });
});

describe("languagesLabel", () => {
  it("joins the chosen languages", () => {
    expect(
      languagesLabel([MentorLanguage.Turkish, MentorLanguage.English]),
    ).toBe("Türkçe · İngilizce");
    expect(languagesLabel(undefined)).toBe("");
  });
});

describe("programDetail", () => {
  const program = {
    id: "p1",
    name: "METU Stars 2026",
    status: ProgramStatus.Active,
    role: "Design mentor",
  };

  it("pairs the status with the mentor's role", () => {
    expect(programDetail(program)).toBe("Aktif · Design mentor");
  });

  it("shows only the status without a role", () => {
    expect(
      programDetail({
        ...program,
        status: ProgramStatus.Completed,
        role: "  ",
      }),
    ).toBe("Tamamlandı");
  });
});

describe("weeklyAvailabilityRows", () => {
  const texts = {
    weekday: (day: Weekday) => WEEKDAY_LABELS[day],
    otherDays: "Diğer günler",
    closed: "Kapalı",
  };

  it("groups a day's ranges in order and closes the other days", () => {
    expect(
      weeklyAvailabilityRows(
        [
          {
            id: "a",
            dayOfWeek: Weekday.Tuesday,
            startTime: "14:00:00",
            endTime: "17:00:00",
            slotMinutes: 45,
          },
          {
            id: "b",
            dayOfWeek: Weekday.Wednesday,
            startTime: "10:00:00",
            endTime: "13:00:00",
            slotMinutes: 45,
          },
          {
            id: "c",
            dayOfWeek: Weekday.Tuesday,
            startTime: "09:00:00",
            endTime: "10:00:00",
            slotMinutes: 45,
          },
        ],
        texts,
      ),
    ).toEqual([
      { label: "Salı", value: "09:00–10:00, 14:00–17:00" },
      { label: "Çarşamba", value: "10:00–13:00" },
      { label: "Diğer günler", value: "Kapalı", muted: true },
    ]);
  });

  it("has no rows when no day is open", () => {
    expect(weeklyAvailabilityRows([], texts)).toEqual([]);
  });
});

describe("ratingLabel", () => {
  it("shows one decimal the Turkish way, and nothing before any feedback", () => {
    expect(ratingLabel(4.8)).toBe("4,8");
    expect(ratingLabel(5)).toBe("5,0");
    expect(ratingLabel(null)).toBeNull();
  });
});
