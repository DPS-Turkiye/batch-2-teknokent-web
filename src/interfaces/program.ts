export enum ProgramMentorStatus {
  Pending = "PENDING",
  Accepted = "ACCEPTED",
  Rejected = "REJECTED",
}

export enum ProgramMentorInvitedBy {
  Coordinator = "COORDINATOR",
  Mentor = "MENTOR",
}

export enum ProgramStatus {
  Active = "ACTIVE",
  Completed = "COMPLETED",
}

export const PROGRAM_STATUS_LABELS: Record<ProgramStatus, string> = {
  [ProgramStatus.Active]: "Aktif",
  [ProgramStatus.Completed]: "Tamamlandı",
};

export type ProgramStartup = {
  id: string;
  name: string;
  description?: string | null;
};

export type ProgramMemberSummary = {
  id: string;
  fullName: string;
  jobTitle: string | null;
  founder: boolean;
};

export type ProgramStartupRoster = {
  id: string;
  name: string;
  description?: string | null;
  members: ProgramMemberSummary[];
};

export type ProgramMentor = {
  mentorId: string;
  fullName: string;
  email: string;
  status: ProgramMentorStatus;
  invitedBy: ProgramMentorInvitedBy;
  createdAt: string;
  role?: string | null;
};

export type Program = {
  id: string;
  name: string;
  coordinatorId: string;
  coordinatorName: string;
  createdAt: string;
  status: ProgramStatus;
  startups: ProgramStartup[];
  mentors: ProgramMentor[];
};

export type ProgramDetail = {
  id: string;
  name: string;
  coordinatorId: string;
  coordinatorName: string;
  createdAt: string;
  startups: ProgramStartupRoster[];
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

export type OrganizationProgram = {
  id: string;
  name: string;
  coordinatorName: string;
};

export type OrganizationPrograms = {
  programs: OrganizationProgram[];
  activeProgramId: string | null;
};

export type ProgramName = {
  id: string;
  name: string;
};
