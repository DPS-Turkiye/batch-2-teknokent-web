export enum EmailStep {
  Write = "write",
  Test = "test",
  Review = "review",
  Send = "send",
}

export enum EmailStepState {
  Done = "done",
  Current = "current",
  Waiting = "waiting",
}

/** What a mail's status chip says: the backend's status, and the hold it does not name. */
export enum CampaignLabel {
  Draft = "DRAFT",
  Waiting = "WAITING",
  Sending = "SENDING",
  Sent = "SENT",
  Stopped = "STOPPED",
}

export enum EmailLinkProblem {
  Empty = "empty",
  Http = "http",
  Email = "email",
  Other = "other",
  Invalid = "invalid",
}

export enum RecipientFilter {
  All = "all",
  NotReached = "notReached",
  Reached = "reached",
  Other = "other",
}

export type StatusTone =
  "green" | "amber" | "red" | "neutral" | "blue" | "orange";
