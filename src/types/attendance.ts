/** What the QR link page shows after it sends the check-in. */
export enum CheckInPhase {
  Checking = "checking",
  Recorded = "recorded",
  AlreadyRecorded = "alreadyRecorded",
  Failed = "failed",
}

/** Why a scanned code recorded nothing; each has its own heading, the backend's message says the rest. */
export enum CheckInFailure {
  /** Unknown, regenerated or expired link, or outside the session's check-in window. */
  NotValid = "notValid",
  /** A mentor, coordinator or a member of another program. */
  NotParticipant = "notParticipant",
  Off = "off",
  Failed = "failed",
}
