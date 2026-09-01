export enum UserRole {
  Admin = "ADMIN",
  Coordinator = "COORDINATOR",
  Mentee = "MENTEE",
  Mentor = "MENTOR",
}

export enum UserAccountStatus {
  Pending = "PENDING",
  Approved = "APPROVED",
  Rejected = "REJECTED",
}

export type AppSession = {
  userId: string;
  email: string;
  fullName: string;
  jobTitle: string;
  role:
    UserRole.Mentee | UserRole.Mentor | UserRole.Admin | UserRole.Coordinator;
  organizationId?: string;
  organizationName?: string;
};

export type BackendUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status?: UserAccountStatus;
  organizationId?: string | null;
  organizationName?: string | null;
  jobTitle?: string | null;
};

export type SessionData = {
  user?: AppSession;
};
