/** What the backend answers once an account is gone. */
export type UserDeletionResult = {
  deletedUserId: string;
  /** True while the person's login or a stored file is still being removed in the background. */
  cleanupPending: boolean;
};
