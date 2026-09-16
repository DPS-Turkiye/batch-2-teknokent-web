import type { ProgramStatus } from "@/interfaces/program";

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

export enum MeetingFrequency {
  Weekly = "WEEKLY",
  Biweekly = "BIWEEKLY",
  Monthly = "MONTHLY",
  AsNeeded = "AS_NEEDED",
}

export const MEETING_FREQUENCY_LABELS: Record<MeetingFrequency, string> = {
  [MeetingFrequency.Weekly]: "Haftada 1",
  [MeetingFrequency.Biweekly]: "2 haftada 1",
  [MeetingFrequency.Monthly]: "Ayda 1",
  [MeetingFrequency.AsNeeded]: "İhtiyaca göre",
};

export enum PrepFileRequirement {
  Required = "REQUIRED",
  Optional = "OPTIONAL",
  NotNeeded = "NOT_NEEDED",
}

export const PREP_FILE_REQUIREMENT_LABELS: Record<PrepFileRequirement, string> =
  {
    [PrepFileRequirement.Required]: "Zorunlu",
    [PrepFileRequirement.Optional]: "İsteğe bağlı",
    [PrepFileRequirement.NotNeeded]: "Gerekmiyor",
  };

export enum MentorLanguage {
  Turkish = "TURKISH",
  English = "ENGLISH",
  German = "GERMAN",
  French = "FRENCH",
  Spanish = "SPANISH",
  Arabic = "ARABIC",
  Russian = "RUSSIAN",
}

export const MENTOR_LANGUAGE_LABELS: Record<MentorLanguage, string> = {
  [MentorLanguage.Turkish]: "Türkçe",
  [MentorLanguage.English]: "İngilizce",
  [MentorLanguage.German]: "Almanca",
  [MentorLanguage.French]: "Fransızca",
  [MentorLanguage.Spanish]: "İspanyolca",
  [MentorLanguage.Arabic]: "Arapça",
  [MentorLanguage.Russian]: "Rusça",
};

/** A program the mentor has joined, with the mentor's own role in it. */
export interface MentorProgram {
  id: string;
  name: string;
  status: ProgramStatus;
  role: string | null;
}

export type MentorProgramRoleInput = { programId: string; role: string };

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
  meetingFrequency?: MeetingFrequency | null;
  prepFileRequirement?: PrepFileRequirement | null;
  languages?: MentorLanguage[];
  activeMenteeCount?: number;
  completedMentorshipCount?: number;
  programNames?: string[];
  programs?: MentorProgram[];
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
  meetingFrequency?: MeetingFrequency | null;
  prepFileRequirement?: PrepFileRequirement | null;
  languages?: MentorLanguage[];
  programRoles?: MentorProgramRoleInput[];
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
  /** Null until the mentor sets one; left out of a save, the saved value stays. */
  menteeCapacity: number | null;
  defaultMeetingDurationMinutes: number;
  meetingBufferMinutes: number;
}

export type UpdateMentorAvailabilitySettingsPayload = Omit<
  MentorAvailabilitySettings,
  "rules"
> & {
  rules: Omit<MentorAvailabilityRule, "id">[];
};
