/** Where a step of the profile-completion wizard stands relative to the one on screen. */
export enum CompletionStepState {
  Done = "done",
  Current = "current",
  Upcoming = "upcoming",
}

/** The rows of "ODTÜ'den gelen bilgiler", in the order the design lists them. */
export enum WelcomeFact {
  FullName = "fullName",
  Email = "email",
  Department = "department",
  ClassYear = "classYear",
  Advisor = "advisor",
}
