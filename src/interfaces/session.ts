export enum UserRole {
  Admin = "ADMIN",
  Coordinator = "COORDINATOR",
  Mentee = "MENTEE",
  Mentor = "MENTOR",
  Academician = "ACADEMICIAN",
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
  /** /api/auth/me's individualMentee at sign-in: useIndividualProgram's first guess until the programs load. */
  individualMentee?: boolean;
  /** Every active permission; `role` is the primary one. Missing on cookies issued before permissions existed. */
  permissions?: UserRole[];
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
  /** When an admin last ended all of this user's sign-ins (ISO time). */
  signInsRevokedAt?: string | null;
  /** A mentee of an individual program (İŞKUR-style); only /api/auth/me fills it. */
  individualMentee?: boolean;
  /** Every active permission, `role` included. */
  permissions?: UserRole[];
};

export type SessionData = {
  user?: AppSession;
  /** When the session was saved (epoch ms); see currentSessionUser. */
  issuedAt?: number;
  /** When the backend last confirmed the account (epoch ms); see getSessionUser. */
  checkedAt?: number;
  /** Signed in with "remember me", so a re-save keeps the cookie's lifetime. */
  persist?: boolean;
};
