import type { TeamChange } from "@/interfaces/team-change";

/** Someone who signed up into the program; organizationName is null without a startup. */
export interface ProgramApprovalPerson {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string | null;
  organizationName: string | null;
  createdAt: string;
}

/** A startup created after signup, waiting for the coordinator. */
export interface ProgramApprovalStartup {
  id: string;
  name: string;
  description: string | null;
  founderName: string | null;
  founderEmail: string | null;
  createdAt: string;
}

export interface ProgramApprovals {
  people: ProgramApprovalPerson[];
  /** Mentors who asked to join the program; organizationName is always null. */
  mentors: ProgramApprovalPerson[];
  startups: ProgramApprovalStartup[];
  /** Leave and removal requests waiting in the program. */
  teamChanges: TeamChange[];
}

/** The path segment of a decision: a person, a mentor, a startup or a team change. */
export enum ApprovalKind {
  People = "people",
  Mentors = "mentors",
  Startups = "startups",
  TeamChanges = "team-changes",
}
