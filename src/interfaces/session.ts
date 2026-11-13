import type { Edition } from "@/interfaces/edition";
import type { Workspace } from "@/interfaces/workspace";

export enum UserRole {
  Admin = "ADMIN",
  Coordinator = "COORDINATOR",
  Mentee = "MENTEE",
  Mentor = "MENTOR",
  Academician = "ACADEMICIAN",
}

/** What an institution (ODTÜ) says a person is; Teknokent accounts have none. */
export enum IdentityKind {
  Student = "STUDENT",
  Academic = "ACADEMIC",
  Staff = "STAFF",
}

export enum UserAccountStatus {
  Pending = "PENDING",
  Approved = "APPROVED",
  Rejected = "REJECTED",
  /** An account an admin deleted: no personal data is left on it and nobody can sign in as it. */
  Deleted = "DELETED",
}

export type AppSession = {
  userId: string;
  email: string;
  fullName: string;
  jobTitle: string;
  role: UserRole;
  organizationId?: string | undefined;
  organizationName?: string | undefined;
  /** /api/auth/me's individualMentee at sign-in: useIndividualProgram's first guess until the programs load. */
  individualMentee?: boolean | undefined;
  /** Every active permission; `role` is the primary one. Missing on cookies issued before permissions existed. */
  permissions?: UserRole[] | undefined;
  /** From /api/auth/me; non-empty for an ODTÜ account, which is what makes it one. */
  institutionKinds?: IdentityKind[];
  /** The workspace the user switched to; see lib/workspaces.ts. */
  activeWorkspace?: Workspace;
  /** The organization is an ODTÜ student's hidden team of one: no startup, and no Girişim workspace. */
  personalOrganization?: boolean;
  /** This deployment's edition (APP_EDITION); the server sets it on every read of the session, never trusting the cookie. */
  edition?: Edition;
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
  institutionKinds?: IdentityKind[];
  /** The organization is an ODTÜ student's hidden team of one; organizationName is then null. */
  personalOrganization?: boolean;
  /** The backend's edition; only /api/auth/me fills it. */
  edition?: Edition | null;
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
