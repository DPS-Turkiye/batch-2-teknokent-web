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

export enum RecipientFilter {
  All = "all",
  NotReached = "notReached",
  Reached = "reached",
  Other = "other",
}

export type StatusTone =
  "green" | "amber" | "red" | "neutral" | "blue" | "orange";
