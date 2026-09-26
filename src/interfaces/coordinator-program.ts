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
};

export type ProgramPhaseInput = {
  name: string;
  startDate: string | null;
  endDate: string | null;
};
