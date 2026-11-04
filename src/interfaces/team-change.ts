import type { UserAccountStatus } from "@/interfaces/session";

/** A member asking to leave, or the team leader asking to remove a member. */
export enum TeamChangeKind {
  Leave = "LEAVE",
  Remove = "REMOVE",
}

/** PENDING until the program's coordinator decides; CANCELLED when withdrawn. */
export enum TeamChangeStatus {
  Pending = "PENDING",
  Approved = "APPROVED",
  Rejected = "REJECTED",
  Cancelled = "CANCELLED",
}

export enum TeamExitReason {
  Left = "LEFT",
  Removed = "REMOVED",
}

export interface TeamChange {
  id: string;
  kind: TeamChangeKind;
  status: TeamChangeStatus;
  organizationId: string;
  organizationName: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  requestedById: string;
  requestedByName: string;
  createdAt: string;
}

/** One stay in a startup; leftAt is null for the current one. */
export interface TeamHistoryStay {
  organizationId: string;
  organizationName: string;
  joinedAt: string;
  leftAt: string | null;
  exitReason: TeamExitReason | null;
  startupApproval: UserAccountStatus;
  startupArchived: boolean;
}

export interface TeamHistory {
  userId: string;
  fullName: string;
  stays: TeamHistoryStay[];
}
