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
