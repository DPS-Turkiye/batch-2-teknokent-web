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
  /** Progress on the program's current training version; "Eğitimde" when started without the badge. */
  training: {
    videoWatched: boolean;
    attempts: number;
    bestScore: number | null;
  };
};

/** Started the training but holds no badge yet ("Eğitimde"). */
export function inTraining(row: Pick<GateBadgeRow, "state" | "training">) {
  return (
    row.state === GateBadgeState.None &&
    (row.training.videoWatched || row.training.attempts > 0)
  );
}

/** The admin's Öğrenciler filter. "Eğitimde" is a view of "Rozet yok"; badges do not expire (D3), so there is no "Süresi doldu". */
export enum StudentFilter {
  All = "ALL",
  None = "NONE",
  InTraining = "IN_TRAINING",
  Active = "ACTIVE",
  Revoked = "REVOKED",
}
