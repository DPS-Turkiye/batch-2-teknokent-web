/** What the QR link page shows after it sends the check-in. */
export enum CheckInPhase {
  Checking = "checking",
  Recorded = "recorded",
  AlreadyRecorded = "alreadyRecorded",
  Failed = "failed",
}

/**
 * Why a scanned code recorded nothing; the backend's message says the rest. A program that takes no attendance is
 * not a reason of its own: its codes read like any dead link, so participants learn nothing about it.
 */
export enum CheckInFailure {
  /** Unknown, regenerated or expired link, or outside the session's check-in window. */
  NotValid = "notValid",
  /** A mentor, coordinator or a member of another program. */
  NotParticipant = "notParticipant",
  Failed = "failed",
}
