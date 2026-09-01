export interface MentorEvidence {
  category: string;
  claim: string;
  quote: string;
  sourcePage: number | null;
  profileVersion: string;
}

export interface MentorProfile {
  id: string;
  fullName: string;
  email: string;
  initials: string;
  professionalTitle: string;
  company: string;
  availabilityLabel: string;
  responseTimeLabel: string;
  meetingMode: string;
  communicationPreference: string;
  mentoringStyle: string;
  fitLabel: string;
  experienceLevel: string;
  sectorExperience: string;
  startupStages: string;
  specialties: string[];
  recommendationReasons: string[];
  recommendationEvidence: MentorEvidence[];
}

export type UpdateMentorProfilePayload = Pick<
  MentorProfile,
  | "professionalTitle"
  | "company"
  | "availabilityLabel"
  | "responseTimeLabel"
  | "meetingMode"
  | "communicationPreference"
  | "mentoringStyle"
  | "fitLabel"
  | "experienceLevel"
  | "sectorExperience"
  | "startupStages"
  | "specialties"
>;

export enum Weekday {
  Monday = "MONDAY",
  Tuesday = "TUESDAY",
  Wednesday = "WEDNESDAY",
  Thursday = "THURSDAY",
  Friday = "FRIDAY",
  Saturday = "SATURDAY",
  Sunday = "SUNDAY",
}

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  [Weekday.Monday]: "Pazartesi",
  [Weekday.Tuesday]: "Salı",
  [Weekday.Wednesday]: "Çarşamba",
  [Weekday.Thursday]: "Perşembe",
  [Weekday.Friday]: "Cuma",
  [Weekday.Saturday]: "Cumartesi",
  [Weekday.Sunday]: "Pazar",
};

export const WEEKDAY_ORDER: Weekday[] = [
  Weekday.Monday,
  Weekday.Tuesday,
  Weekday.Wednesday,
  Weekday.Thursday,
  Weekday.Friday,
  Weekday.Saturday,
  Weekday.Sunday,
];

export interface MentorAvailabilityRule {
  id: string;
  dayOfWeek: Weekday;
  startTime: string;
  endTime: string;
  slotMinutes: number;
}

export interface MentorAvailabilitySlot {
  id: string;
  startsAt: string;
  durationMinutes: number;
  booked: boolean;
}
