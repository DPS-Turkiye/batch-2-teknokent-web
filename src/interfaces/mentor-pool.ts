export enum MentorPoolStatus {
  Active = "ACTIVE",
  Full = "FULL",
  AwaitingApproval = "AWAITING_APPROVAL",
  Invited = "INVITED",
  InviteExpiring = "INVITE_EXPIRING",
  InviteExpired = "INVITE_EXPIRED",
}

/** A mentor in a program's pool, or an invite link nobody signed up with yet (then `mentorId` is null). */
export type MentorPoolRow = {
  mentorId: string | null;
  inviteId: string | null;
  fullName: string | null;
  email: string;
  status: MentorPoolStatus;
  expertise: string[];
  programs: string[];
  activeTeams: number;
  capacity: number;
  since: string | null;
  expiresAt: string | null;
  inviteCode: string | null;
};

/** The "Uzmanlık doğrulama" pop-up. */
export type MentorPoolReview = {
  mentorId: string;
  fullName: string;
  email: string;
  professionalTitle: string | null;
  requestedAt: string;
  viaInvite: boolean;
  emailVerified: boolean;
  linkedinUrl: string | null;
  invitedBy: string | null;
  expertise: string[];
  availability: string | null;
  capacity: number;
};
