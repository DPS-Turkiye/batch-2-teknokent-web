import type { UserAccountStatus, UserRole } from "@/interfaces/session";

/** What adding an email as a coordinator would do; the backend decides, the form explains. */
export enum CoordinatorCandidateStatus {
  New = "NEW",
  Promotable = "PROMOTABLE",
  Reactivatable = "REACTIVATABLE",
  AlreadyCoordinator = "ALREADY_COORDINATOR",
  Admin = "ADMIN",
  TeamMember = "TEAM_MEMBER",
  MentorInMentorship = "MENTOR_IN_MENTORSHIP",
}

/** `GET /api/admin/coordinators/candidate?email=`; the user fields are null for a new email. */
export type CoordinatorCandidate = {
  email: string;
  status: CoordinatorCandidateStatus;
  userId: string | null;
  fullName: string | null;
  role: UserRole | null;
};

export type CoordinatorAccount = {
  id: string;
  email: string;
  fullName: string;
  status: UserAccountStatus;
  outcome: CoordinatorCandidateStatus | null;
};

/** `GET /api/admin/coordinators/search?q=`: an approved coordinator whose email starts with what was typed. */
export type CoordinatorSearchResult = {
  id: string;
  fullName: string;
  email: string;
};

/** An email with no menton account, invited as a coordinator when the program is saved. */
export type NewCoordinatorInput = {
  fullName: string;
  email: string;
};
