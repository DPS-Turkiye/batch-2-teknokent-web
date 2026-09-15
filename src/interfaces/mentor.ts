export interface MentorEvidence {
  category: string;
  claim: string;
  quote: string;
  sourcePage: number | null;
  profileVersion: string;
}

export interface MentorExperience {
  title: string;
  organization: string | null;
  period: string | null;
  summary: string | null;
}

/** An editable past role; blanks are sent as empty strings and stored as null. */
export type MentorExperienceInput = {
  title: string;
  organization: string;
  period: string;
  summary: string;
};

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
  menteeCapacity?: number | null;
  about?: string;
  defaultMeetingDurationMinutes?: number;
  meetingBufferMinutes?: number;
  activeMenteeCount?: number;
  completedMentorshipCount?: number;
  programNames?: string[];
  experiences?: MentorExperience[];
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
> & {
  // Left out, the backend keeps what the mentor saved before.
  menteeCapacity?: number | null;
  experiences?: MentorExperienceInput[];
  about?: string;
};

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

export interface MentorAvailabilityException {
  id?: string;
  startsOn: string;
  endsOn: string;
  reason: string | null;
}

export interface MentorAvailabilitySettings {
  rules: MentorAvailabilityRule[];
  exceptions: MentorAvailabilityException[];
  menteeCapacity: number;
  defaultMeetingDurationMinutes: number;
  meetingBufferMinutes: number;
}

export type UpdateMentorAvailabilitySettingsPayload = Omit<
  MentorAvailabilitySettings,
  "rules"
> & {
  rules: Omit<MentorAvailabilityRule, "id">[];
};
