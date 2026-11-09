import type { ProgramStatus, ProgramType } from "@/interfaces/program";

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
  status: "PENDING" | "ACCEPTED" | "REJECTED";
};

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "COORDINATOR" | "MENTOR" | "MENTEE";
  status: "PENDING" | "APPROVED" | "REJECTED";
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
  status: "PLANNED" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
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
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
};

export type AdminRequest = {
  id: string;
  organizationId: string;
  organizationName: string;
  mentorId: string | null;
  mentorName: string | null;
  supportArea: string | null;
  status: string;
  createdAt: string;
};

export type AdminBottleneck = {
  id: string;
  title: string;
  severity: string;
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
