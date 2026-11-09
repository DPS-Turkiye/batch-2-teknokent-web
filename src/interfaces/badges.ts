/** Menton's badge catalogue; names and descriptions are in the messages under `badges`. */
export enum BadgeCode {
  PeerMentor = "PEER_MENTOR",
  FirstSession = "FIRST_SESSION",
  Sessions10 = "SESSIONS_10",
  Hours25 = "HOURS_25",
  WellRated = "WELL_RATED",
  ActiveMentee = "ACTIVE_MENTEE",
}

/** A gate badge opens a permission (Akran Mentoru → mentoring); an achievement is shown on the profile. */
export enum BadgeKind {
  Gate = "GATE",
  Achievement = "ACHIEVEMENT",
}

export enum BadgeStatus {
  Active = "ACTIVE",
  Expired = "EXPIRED",
  Revoked = "REVOKED",
}

export enum BadgeSource {
  Rule = "RULE",
  Admin = "ADMIN",
  Coordinator = "COORDINATOR",
}

/** Where a person stands with a program's gate badge: never awarded, or the latest award's status. */
export enum GateBadgeState {
  None = "NONE",
  Active = "ACTIVE",
  Expired = "EXPIRED",
  Revoked = "REVOKED",
}

/** One of the signed-in person's own awards (`GET /api/me/badges`); only here and for staff is `reason` shown. */
export type BadgeAward = {
  id: string;
  code: BadgeCode;
  kind: BadgeKind;
  programId: string | null;
  programName: string | null;
  status: BadgeStatus;
  source: BadgeSource;
  awardedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  reason: string | null;
};

/** The badges earned by rules from sessions and feedback; every code but the gate badge. */
export type AchievementCode = Exclude<BadgeCode, BadgeCode.PeerMentor>;

/**
 * One achievement badge as its holder sees it (`GET /api/me/badges/achievements`): earned, or how far along.
 * `current`/`target` count sessions (FIRST_SESSION, SESSIONS_10), minutes (HOURS_25), rated feedbacks
 * (WELL_RATED, which also needs `average` ≥ `averageTarget`) or sessions with feedback given (ACTIVE_MENTEE).
 */
export type AchievementProgress = {
  code: AchievementCode;
  earned: boolean;
  awardedAt: string | null;
  current: number;
  target: number;
  average: number | null;
  averageTarget: number | null;
};

/** An active badge as anyone who can see the person sees it (`GET /api/users/{id}/badges`). */
export type PublicBadge = {
  code: BadgeCode;
  kind: BadgeKind;
  programId: string | null;
  awardedAt: string;
};

/** A person and their gate badge in a program, for Katılımcılar and the admin's Öğrenciler. */
export type GateBadgeRow = {
  userId: string;
  fullName: string;
  email: string;
  programId: string;
  programName: string;
  state: GateBadgeState;
  /** The latest award, the one to take back while it is active. */
  awardId: string | null;
  source: BadgeSource | null;
  awardedAt: string | null;
  revokedAt: string | null;
  reason: string | null;
};
