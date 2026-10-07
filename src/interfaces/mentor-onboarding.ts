import { MeetingFrequency, Weekday, WEEKDAY_ORDER } from "@/interfaces/mentor";
import type { UploadedFile } from "@/interfaces/signup";

export enum MentorOnboardingStep {
  Profile = 1,
  Areas = 2,
  Availability = 3,
  Review = 4,
}

export const MENTOR_STEPS: {
  step: MentorOnboardingStep;
  title: string;
  hint: string;
}[] = [
  {
    step: MentorOnboardingStep.Profile,
    title: "Uzmanlık profilin",
    hint: "Startuplar seni bununla görür",
  },
  {
    step: MentorOnboardingStep.Areas,
    title: "Mentorluk alanların",
    hint: "Eşleşme buna göre kurulur",
  },
  {
    step: MentorOnboardingStep.Availability,
    title: "Müsaitlik ve kapasite",
    hint: "Talepler buna göre gelir",
  },
  {
    step: MentorOnboardingStep.Review,
    title: "Gözden geçir ve gönder",
    hint: "Koordinatör onayına gider",
  },
];

export const MENTOR_STEP_ORDER = MENTOR_STEPS.map((item) => item.step);

/** Step 1 starts with the CV; the form opens after it is read, or right away by hand. */
export enum IntroPhase {
  Upload = "upload",
  Parsing = "parsing",
  Review = "review",
}

export interface ParsedExperience {
  title: string;
  organization: string;
  period?: string;
  summary?: string;
}

export interface ParsedProfile {
  fullName: string;
  title: string;
  company: string;
  totalExperience: string;
  history: ParsedExperience[];
  inferredAreas: string[];
}

export const PLACEHOLDER_PARSED_PROFILE: ParsedProfile = {
  fullName: "",
  title: "",
  company: "",
  totalExperience: "",
  history: [],
  inferredAreas: [],
};

export const ABOUT_MAX_LENGTH = 400;
export const MAX_EXPERIENCES = 3;
export const MAX_MENTOR_TOPICS = 5;
export const MAX_OFFERINGS = 10;

export const MENTOR_TOPIC_OPTIONS = [
  "UX Stratejisi",
  "Product Design",
  "User Research",
  "Design Systems",
  "Product Validation",
  "UX/UI Review",
  "Product Experience",
  "Büyüme",
  "Finans",
  "Pazarlama",
  "Satış",
  "Teknoloji",
] as const;

export const MEETING_FORMAT_OPTIONS = [
  "Online",
  "Yüz yüze",
  "Her ikisi de",
] as const;
export const RESPONSE_TIME_OPTIONS = [
  "Aynı gün",
  "1–2 gün",
  "3–5 gün",
] as const;
export const MEETING_DURATION_OPTIONS = [30, 45, 60, 90] as const;
export const MEETING_BUFFER_OPTIONS = [0, 10, 15, 30] as const;
export const CAPACITY_MIN = 1;
export const CAPACITY_MAX = 50;

export interface WeeklySlot {
  enabled: boolean;
  start: string;
  end: string;
}

export type WeeklyAvailability = Record<Weekday, WeeklySlot>;

export function emptyWeek(): WeeklyAvailability {
  return Object.fromEntries(
    WEEKDAY_ORDER.map((day) => [
      day,
      { enabled: false, start: "10:00", end: "13:00" },
    ]),
  ) as WeeklyAvailability;
}

export interface MentorOnboardingDraft {
  firstName: string;
  lastName: string;
  linkedin: string;
  about: string;
  photo: UploadedFile | null;
  cv: UploadedFile | null;
  /** Set once the CV is stored on the server, so a resumed draft knows it is not lost. */
  cvStoredName: string | null;
  profile: ParsedProfile;
  topics: string[];
  stages: string[];
  offerings: string[];
  week: WeeklyAvailability;
  capacity: number;
  durationMinutes: number;
  bufferMinutes: number;
  frequency: MeetingFrequency;
  format: string;
  responseTime: string;
  consent: boolean;
}
