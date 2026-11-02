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
  startups: ProgramApprovalStartup[];
}

/** The path segment of a decision: a person or a startup. */
export enum ApprovalKind {
  People = "people",
  Startups = "startups",
}
