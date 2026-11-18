/** What the link on an active mentorship's card opens. */
export enum MentorshipLinkKind {
  Meeting = "meeting",
  Request = "request",
}

export enum MentorshipWorkspaceTab {
  MentorPool = "mentor-pool",
  Active = "active",
  Requests = "requests",
  History = "history",
  Regular = "regular",
}

/** The step a mentor is on in the request review dialog; `Propose` is also the `?review=` link value. */
export enum MentorReviewMode {
  Accept = "accept",
  Propose = "propose",
  AskInfo = "info",
}
