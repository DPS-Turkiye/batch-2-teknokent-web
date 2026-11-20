/** Why a person may not delete their own account; mirrors the backend's `AccountDeletionBlock`. */
export enum AccountDeletionBlock {
  Staff = "STAFF",
  Founder = "FOUNDER",
  Institution = "INSTITUTION",
}

/** What the signed-in person may delete themselves, as `GET /api/me/deletion` answers. */
export type SelfDeletionOptions = {
  account: {
    allowed: boolean;
    blockedReason: AccountDeletionBlock | null;
  };
  /** Set only for the founder of a startup they may delete. */
  startup: { id: string; name: string } | null;
};

/** What the backend answers once a startup is gone. */
export type StartupDeletionResult = {
  deletedOrganizationId: string;
  /** True while a stored file is still being removed in the background. */
  cleanupPending: boolean;
};

/** The backend's error codes the deletion screens branch on. */
export const SelfDeletionErrorCode = {
  ReauthRequired: "REAUTH_REQUIRED",
  Founder: "SELF_DELETE_FOUNDER",
  Confirmation: "SELF_DELETE_CONFIRMATION",
} as const;
