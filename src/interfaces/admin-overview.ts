import type { MentorshipStatus } from "@/interfaces/coordinator-mentorship";
import type { MeetingStatus } from "@/interfaces/meeting";
import type { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import type {
  ProgramMentorStatus,
  ProgramStatus,
  ProgramType,
} from "@/interfaces/program";
import type { UserAccountStatus, UserRole } from "@/interfaces/session";

export type AdminProgram = {
  id: string;
  name: string;
  status: ProgramStatus;
  type: ProgramType;
  createdAt: string;
  /** The first assigned coordinator; null until one is assigned (an admin who created it doesn't count). */
  coordinatorId: string | null;
  /** Every assigned coordinator, comma-separated; null until one is assigned. */
  coordinatorName: string | null;
  /** Every coordinator, first one first. Absent from a backend older than v1.6.53, so read it through `programsForCoordinator`. */
  coordinatorIds?: string[];
  startupCount: number;
  acceptedMentorCount: number;
  pendingMentorCount: number;
  startups: AdminStartup[];
  mentors: AdminMentorMembership[];
};

/** What the admin puts into a program; also the path segment of the assignment. */
export enum ProgramMemberKind {
  Mentors = "mentors",
  Startups = "startups",
}

/** A team's move from one program to another, as the backend recorded it. */
export type ProgramTeamMove = {
  id: string;
  organizationId: string;
  fromProgramId: string;
  fromProgramName: string;
  toProgramId: string;
  toProgramName: string;
  movedAt: string;
  /** Unanswered mentorship requests of the old program that the move closed. */
  withdrawnRequests: number;
};

export type AdminStartup = {
  id: string;
  name: string;
  sector: string | null;
  programId: string;
  programName: string;
  founderName?: string | null;
  founderJobTitle?: string | null;
};

export type AdminMentorMembership = {
  mentorId: string;
  fullName: string;
  email: string;
  status: ProgramMentorStatus;
};

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  /** Every active permission, `role` included. Absent from a backend older than v1.6.53, so read it through `hasRole`. */
  roles?: UserRole[];
  status: UserAccountStatus;
  organizationId: string | null;
  organizationName: string | null;
  jobTitle: string | null;
  createdAt?: string | null;
  expertise?: string[];
  /** Coordinators only: false until the e-mailed setup link set a password; null when unknown. */
  passwordSet?: boolean | null;
};

export type AdminMentorship = {
  id: string;
  mentorId: string;
  mentorName: string;
  organizationId: string;
  organizationName: string;
  status: MentorshipStatus;
  startDate: string;
  endDate: string | null;
  progressPercent: number;
  daysSinceMeeting: number | null;
  goalDone?: number;
  goalTotal?: number;
  /** The program it was made in; null for one made before programs were recorded. */
  programId?: string | null;
};

export type AdminMeetingMark = {
  mentorId: string;
  organizationId: string;
  scheduledAt: string;
  /** Never GOOGLE_CALENDAR: the overview lists only meetings the app recorded. */
  status: MeetingStatus;
};

export type AdminRequest = {
  id: string;
  organizationId: string;
  organizationName: string;
  mentorId: string | null;
  mentorName: string | null;
  supportArea: string | null;
  status: MentorshipRequestStatus;
  createdAt: string;
};

/** How serious a bottleneck is (the backend's BottleneckSeverity). */
export enum BottleneckSeverity {
  Low = "LOW",
  Medium = "MEDIUM",
  High = "HIGH",
  Critical = "CRITICAL",
}

export type AdminBottleneck = {
  id: string;
  title: string;
  severity: BottleneckSeverity;
  status: string;
  organizationId: string;
  organizationName: string;
  createdAt: string;
};

export type AdminOverview = {
  programs: AdminProgram[];
  users: AdminUser[];
  mentorships: AdminMentorship[];
  requests: AdminRequest[];
  bottlenecks: AdminBottleneck[];
  meetingsLast8Weeks: number;
  meetings?: AdminMeetingMark[];
};

type NamelessTeam<T extends { organizationName: string }> = Omit<
  T,
  "organizationName"
> & { organizationName: string | null };

/**
 * The overview as the API sends it: a student's personal team (their hidden team of one) has no name, since it is never
 * shown as a startup. useAdminOverview labels those rows before any screen reads them.
 */
export type AdminOverviewResponse = Omit<
  AdminOverview,
  "mentorships" | "requests" | "bottlenecks"
> & {
  mentorships: NamelessTeam<AdminMentorship>[];
  requests: NamelessTeam<AdminRequest>[];
  bottlenecks: NamelessTeam<AdminBottleneck>[];
};
