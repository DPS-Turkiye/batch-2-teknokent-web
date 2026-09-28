import type { CoordinatorMentorship } from "@/interfaces/coordinator-mentorship";
export enum ProgramLifecycle {
  Upcoming = "UPCOMING",
  Active = "ACTIVE",
  Completed = "COMPLETED",
}

export type ProgramPhase = {
  id: string;
  name: string;
  position: number;
  startDate: string | null;
  endDate: string | null;
};

/** A program as its coordinator sees it (`GET /api/coordinator/programs`). */
export type CoordinatorProgram = {
  id: string;
  name: string;
  status: "ACTIVE" | "COMPLETED";
  lifecycle: ProgramLifecycle;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  coordinatorId: string;
  coordinatorName: string | null;
  teamCount: number;
  mentorCount: number;
  pendingMentorCount: number;
  activeMentorshipCount: number;
  riskyMentorshipCount: number;
  awaitingMatchCount: number;
  oldestAwaitingMatchDays: number | null;
  currentPhase: ProgramPhase | null;
  phases: ProgramPhase[];
  currentWeek: number | null;
  totalWeeks: number | null;
};

export enum ProgramEventKind {
  Event = "EVENT",
  Deadline = "DEADLINE",
}

export type ProgramEvent = {
  id: string;
  programId: string;
  title: string;
  kind: ProgramEventKind;
  startsAt: string;
  endsAt: string | null;
  description: string | null;
};

/** An event as a startup or mentor of the program sees it. */
export type MemberProgramEvent = ProgramEvent & { programName: string };

export type CreateProgramEventInput = {
  title: string;
  kind: ProgramEventKind;
  startsAt: string;
  endsAt: string | null;
  description: string | null;
};

export type CoordinatorRef = {
  id: string;
  fullName: string;
  /** The coordinator who created the program; the others were added to it. */
  owner: boolean;
};

export type ProgramRules = {
  meetingFrequencyDays: number;
  staleAfterDays: number;
  meetingNoteRequired: boolean;
  autoMatchSuggestions: boolean;
  defaultMentorCapacity: number;
  communicationGapDays: number;
  bottleneckFlagDays: number;
};

/** One program in full (`GET /api/coordinator/programs/{id}`): Genel Bakış and Program Ayarları. */
export type CoordinatorProgramDetail = {
  program: CoordinatorProgram;
  rules: ProgramRules;
  health: {
    healthy: number;
    followUp: number;
    risky: number;
    riskyTopics: { title: string; teams: number }[];
  };
  awaitingTeams: {
    organizationId: string;
    name: string;
    waitingDays: number;
  }[];
  upcomingEvents: ProgramEvent[];
  teams: { mentored: number; awaitingMatch: number };
  mentors: {
    withCapacity: number;
    full: number;
    idle: number;
    pending: number;
  };
  coordinators: CoordinatorRef[];
  missingNoteMeetings: number;
};

export type UpdateProgramDetailsInput = {
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  meetingFrequencyDays: number;
  staleAfterDays: number;
  meetingNoteRequired: boolean;
  autoMatchSuggestions: boolean;
  /** Omitted keeps the saved value. */
  defaultMentorCapacity?: number;
  communicationGapDays?: number;
  bottleneckFlagDays?: number;
};

export type ProgramPhaseInput = {
  name: string;
  startDate: string | null;
  endDate: string | null;
};

/** WAITING: the code was handed out but the team lead has not signed up with it yet. */
export enum TeamJoinStatus {
  Waiting = "WAITING",
  Joined = "JOINED",
}

/** One row of the program's Takımlar tab (`GET /api/coordinator/programs/{id}/teams`). */
export type ProgramTeam = {
  inviteId: string | null;
  organizationId: string | null;
  name: string;
  status: TeamJoinStatus;
  leadName: string | null;
  leadEmail: string | null;
  code: string | null;
  invitedAt: string | null;
  joinedAt: string | null;
  memberCount: number;
  codeSentAt: string | null;
  /** SES refused the last code email; the team shows under "Sorunlu". */
  codeSendFailed: boolean;
};

export type TeamInviteInput = { teamName: string; leadEmail: string };

/** The "Yeni program" wizard, sent in one request. */
export type CreateProgramInput = {
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  coordinatorIds: string[];
  defaultMentorCapacity: number;
  meetingFrequencyDays: number;
  communicationGapDays: number;
  bottleneckFlagDays: number;
  teams: TeamInviteInput[];
};

export type ProgramTeamPerson = {
  id: string;
  name: string;
  jobTitle: string | null;
  email: string | null;
  joinedAt: string | null;
};

/** The Takımlar drawer (`GET /api/coordinator/programs/{id}/team-details/{organizationId}`). */
export type ProgramTeamDetail = {
  organizationId: string;
  name: string;
  sector: string | null;
  lead: ProgramTeamPerson | null;
  code: string | null;
  members: ProgramTeamPerson[];
  mentorships: CoordinatorMentorship[];
};
