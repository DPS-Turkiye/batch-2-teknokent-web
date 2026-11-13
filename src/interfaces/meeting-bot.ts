/** Where a meeting's recording bot is (`GET /api/assistant/bots/{platform}/{nativeMeetingId}`). */
export enum MeetingBotState {
  None = "NONE",
  Requested = "REQUESTED",
  Joining = "JOINING",
  WaitingForAdmission = "WAITING_FOR_ADMISSION",
  Active = "ACTIVE",
  NeedsHelp = "NEEDS_HELP",
  Stopping = "STOPPING",
  Completed = "COMPLETED",
  Failed = "FAILED",
}

/** Why a recording bot's run ended. */
export enum MeetingBotEndReason {
  Stopped = "STOPPED",
  LeftAlone = "LEFT_ALONE",
  NotAdmittedInTime = "NOT_ADMITTED_IN_TIME",
  Rejected = "REJECTED",
  JoinFailed = "JOIN_FAILED",
  Other = "OTHER",
}

export type MeetingBotStatus = {
  platform: string;
  nativeMeetingId: string;
  state: MeetingBotState;
  endReason: MeetingBotEndReason | null;
  /** ISO-8601, UTC. */
  requestedAt: string | null;
};
