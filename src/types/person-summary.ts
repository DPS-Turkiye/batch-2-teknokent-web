import type { OptionGroup } from "@/hooks/use-option-label";
import type { MentorLanguage, Weekday } from "@/interfaces/mentor";

/** How a profile-page fact turns into text: as typed, through an option list, as languages, or as a date. */
export enum SummaryFactKind {
  Text = "TEXT",
  Option = "OPTION",
  Languages = "LANGUAGES",
  Date = "DATE",
}

/** The `personSummary` message keys a fact can be labelled with. */
export type SummaryFactLabel =
  | "facts.experienceLevel"
  | "facts.sectorExperience"
  | "facts.startupStages"
  | "facts.meetingMode"
  | "facts.languages"
  | "startupFields.sector"
  | "startupFields.maturity"
  | "startupFields.fundingStage"
  | "startupFields.foundedYear"
  | "startupFields.problem"
  | "startupFields.solution"
  | "activeMentees"
  | "completedMentorships"
  | "registered";

export type SummaryFact =
  | { kind: SummaryFactKind.Text; label: SummaryFactLabel; text: string }
  | {
      kind: SummaryFactKind.Option;
      label: SummaryFactLabel;
      group: OptionGroup;
      value: string;
    }
  | {
      kind: SummaryFactKind.Languages;
      label: SummaryFactLabel;
      languages: MentorLanguage[];
    }
  | { kind: SummaryFactKind.Date; label: SummaryFactLabel; date: string };

export type SummaryRoleLabel = "roles.MENTOR" | "roles.MENTEE";

export type SummaryProgramNote =
  "relations.MENTOR" | "relations.MENTEE" | "mentorPending";

export type SummaryStatusTone = "green" | "amber" | "red";

export type SummaryStatusLabel =
  | "statuses.APPROVED"
  | "statuses.PENDING"
  | "statuses.REJECTED"
  | "statuses.DELETED";

export type KeyedText = { key: string; value: string };

/** A mentor's chosen times, grouped for the "Müsait zamanlar" card; the hook formats dates and day names. */
export type SummaryAvailability = {
  days: { day: Weekday; ranges: KeyedText[] }[];
  daysOff: { key: string; startsOn: string; endsOn: string }[];
  extraSlots: { key: string; startsAt: string; durationMinutes: number }[];
  isEmpty: boolean;
};

/** What the profile page shows, decided from the backend's summary; the hook translates it. */
export type PersonSummaryModel = {
  fullName: string;
  initials: string;
  email: string;
  roleLabel: SummaryRoleLabel | null;
  status: { tone: SummaryStatusTone; label: SummaryStatusLabel };
  headline: string | null;
  linkedinUrl: string | null;
  about: string | null;
  tags: KeyedText[];
  mentor: {
    facts: SummaryFact[];
    offerings: KeyedText[];
    experiences: { key: string; heading: string; detail: string }[];
    educations: KeyedText[];
    availability: SummaryAvailability;
  } | null;
  /** Shown for mentees even without a startup, so the empty state explains it. */
  showStartup: boolean;
  startup: {
    name: string;
    description: string | null;
    websiteUrl: string | null;
    facts: SummaryFact[];
  } | null;
  programs: {
    key: string;
    id: string;
    name: string;
    note: SummaryProgramNote;
  }[];
  activity: SummaryFact[];
  showTeamHistory: boolean;
};
