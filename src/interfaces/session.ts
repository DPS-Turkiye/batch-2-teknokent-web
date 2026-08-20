export enum UserRole {
  Admin = "ADMIN",
  Mentee = "MENTEE",
  Mentor = "MENTOR",
}

export type DemoSession = {
  userId: string;
  email: string;
  fullName: string;
  jobTitle: string;
  role: UserRole.Mentee | UserRole.Mentor;
  organizationId?: string;
  organizationName?: string;
};

export type BackendUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationId?: string | null;
  organizationName?: string | null;
  jobTitle?: string | null;
};

export type SessionData = {
  user?: DemoSession;
};
