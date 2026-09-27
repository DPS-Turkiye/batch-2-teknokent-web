import type { MentorshipStatus } from "@/interfaces/coordinator-mentorship";

/** Where a waiting team's "İhtiyaç" comes from: their open request, their startup profile, or nothing yet. */
export enum MatchNeedSource {
  Request = "REQUEST",
  Profile = "PROFILE",
  None = "NONE",
}

export type WaitingTeam = {
  organizationId: string;
  name: string;
  sector: string | null;
  stage: string | null;
  leadName: string | null;
  waitingDays: number;
  needSource: MatchNeedSource;
  needTopic: string | null;
  needText: string | null;
};

export type ProgramMatch = {
  mentorshipId: string;
  organizationId: string;
  teamName: string;
  mentorId: string;
  mentorName: string;
  status: MentorshipStatus;
  startDate: string;
  endDate: string | null;
};

export type MatchingOverview = {
  waiting: WaitingTeam[];
  active: ProgramMatch[];
  past: ProgramMatch[];
};

export type MatchCandidate = {
  mentorId: string;
  fullName: string;
  title: string | null;
  specialties: string[];
  availability: string | null;
  activeTeams: number;
  capacity: number;
  reasons: string[];
};

export type MatchSuggestions = {
  method: string | null;
  recommended: MatchCandidate[];
  pool: MatchCandidate[];
};
