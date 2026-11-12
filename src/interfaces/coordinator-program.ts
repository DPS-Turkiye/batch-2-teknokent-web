import type { NewCoordinatorInput } from "@/interfaces/admin-coordinator";
import type { CoordinatorMentorship } from "@/interfaces/coordinator-mentorship";
import type { ProgramStatus, ProgramType } from "@/interfaces/program";
import type { ProgramPlanWeek } from "@/interfaces/program-week";
import type { DocumentKind } from "@/interfaces/startup-document";

export enum ProgramLifecycle {
  Draft = "DRAFT",
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
  /** "Problem doğrulama raporu · 12 kullanıcı görüşmesi"; shown in the team's progress. */
  expectedOutput?: string | null;
};

/** The file a program's plan was read from: a weekly program, or an older syllabus (`kind` tells which). */
export type ProgramSyllabus = {
  id: string;
  filename: string;
  sizeBytes: number;
  uploadedAt: string;
  kind: DocumentKind;
};

/** A program as its coordinator sees it (`GET /api/coordinator/programs`). */
export type CoordinatorProgram = {
  id: string;
  name: string;
  status: ProgramStatus;
  lifecycle: ProgramLifecycle;
  type: ProgramType;
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
  /** Lowercase, no "@" (metu.edu.tr); null lets any address join. */
  eligibleEmailDomain: string | null;
  /** Only addresses on the program's list may join (İŞKUR). */
  rosterOnly: boolean;
  /** Each mentee joins as a team of one, without creating a startup. */
  individualMentees: boolean;
};

/** One address on a roster-only program's list; `registered` once an account uses it. */
export type ProgramEligibleEmail = {
  id: string;
  email: string;
  addedAt: string;
  registered: boolean;
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
  syllabus: ProgramSyllabus | null;
  /** Everything Onaylar lists as waiting: applicants, mentor applications, startups and team changes. */
  pendingApprovalCount: number;
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
  defaultMentorCapacity?: number | undefined;
  communicationGapDays?: number | undefined;
  bottleneckFlagDays?: number | undefined;
  /** An empty string clears the domain. */
  eligibleEmailDomain?: string | null | undefined;
  rosterOnly?: boolean | undefined;
  individualMentees?: boolean | undefined;
};

export type ProgramPhaseInput = {
  name: string;
  startDate: string | null;
  endDate: string | null;
  expectedOutput?: string | null;
};

/** A phase read from a syllabus; nothing is saved until the coordinator confirms it. */
export type ProposedPhase = ProgramPhaseInput;

/** Phases and a week-by-week plan read from a syllabus; nothing is saved until the coordinator confirms them. */
export type SyllabusPhases = {
  phases: ProposedPhase[];
  /** Missing from a backend that predates the week plan. */
  weeks?: ProgramPlanWeek[];
  pageCount: number;
};

export type ExtractSyllabusPhasesInput = {
  documentId: string;
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

/** The admin's "Yeni Program Oluştur", sent in one request; the program starts as a draft. */
export type CreateProgramInput = {
  type: ProgramType;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  coordinatorIds: string[];
  /** Emails with no account yet: the backend opens a coordinator account and mails a password link. */
  newCoordinators: NewCoordinatorInput[];
  defaultMentorCapacity?: number | undefined;
  meetingFrequencyDays?: number | undefined;
  communicationGapDays?: number | undefined;
  bottleneckFlagDays?: number | undefined;
  teams?: TeamInviteInput[] | undefined;
  phases?: ProgramPhaseInput[] | undefined;
  syllabusDocumentId?: string | null;
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
