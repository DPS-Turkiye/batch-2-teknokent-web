export enum ProgramMentorStatus {
  Pending = "PENDING",
  Accepted = "ACCEPTED",
  Rejected = "REJECTED",
}

export enum ProgramMentorInvitedBy {
  Coordinator = "COORDINATOR",
  Mentor = "MENTOR",
}

export type ProgramStartup = {
  id: string;
  name: string;
  description?: string | null;
};

export type ProgramMentor = {
  mentorId: string;
  fullName: string;
  email: string;
  status: ProgramMentorStatus;
  invitedBy: ProgramMentorInvitedBy;
  createdAt: string;
};

export type Program = {
  id: string;
  name: string;
  coordinatorId: string;
  coordinatorName: string;
  createdAt: string;
  startups: ProgramStartup[];
  mentors: ProgramMentor[];
};

export type ProgramInvitation = {
  programId: string;
  programName: string;
  coordinatorId: string;
  coordinatorName: string;
  createdAt: string;
};

export type ProgramDirectory = {
  startups: ProgramStartup[];
  mentors: Array<{
    id: string;
    fullName: string;
    email: string;
  }>;
};

/**
 * A program the signed-in user's own startup has been assigned to. Narrower than
 * {@link Program} on purpose: the backend does not expose the other startups or
 * the mentor roster of a program a startup merely belongs to.
 */
export type OrganizationProgram = {
  id: string;
  name: string;
  coordinatorName: string;
};

export type OrganizationPrograms = {
  programs: OrganizationProgram[];
  /** Null when the startup has no assignment, or has one but has not chosen. */
  activeProgramId: string | null;
};
