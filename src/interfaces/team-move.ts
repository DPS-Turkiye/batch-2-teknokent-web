/** Why the backend will not move a person; the dialog explains it instead of listing teams. */
export enum TeamMoveBlock {
  NotApproved = "NOT_APPROVED",
  NotATeamMember = "NOT_A_TEAM_MEMBER",
  NoTeam = "NO_TEAM",
  Founder = "FOUNDER",
}

/** A team on the move dialog with the program it is shown under; an admin may see one in no program. */
export interface TeamMoveTeam {
  organizationId: string;
  name: string;
  programId: string | null;
  programName: string | null;
}

/** Where the person is, why they cannot move if so, and the teams this caller may move them to. */
export interface MemberTeamMoveOptions {
  userId: string;
  fullName: string;
  currentTeam: TeamMoveTeam | null;
  blockedBy: TeamMoveBlock | null;
  /** The person founded their startup and is alone in it, so moving them archives it. */
  archivesCurrentTeam: boolean;
  targets: TeamMoveTeam[];
}

export interface MemberTeamMoveResult {
  userId: string;
  from: TeamMoveTeam;
  to: TeamMoveTeam;
  programId: string | null;
  /** The old startup was emptied by the move and archived; its unanswered requests were withdrawn. */
  archivedFrom: boolean;
  withdrawnRequests: number;
  movedAt: string;
}
