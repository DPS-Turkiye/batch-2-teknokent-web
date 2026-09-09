export enum MentorRequestStep {
  Need = 1,
  Expectation = 2,
  Info = 3,
  MentorSelect = 4,
}

export enum MentorRequestUrgency {
  ThisWeek = "THIS_WEEK",
  NextTwoWeeks = "NEXT_TWO_WEEKS",
  ThisMonth = "THIS_MONTH",
  NotUrgent = "NOT_URGENT",
}

export enum MentorshipFormat {
  SingleMeeting = "SINGLE_MEETING",
  ShortTerm = "SHORT_TERM",
  Regular = "REGULAR",
  ExpertReferral = "EXPERT_REFERRAL",
}

export enum MentorMeetingMode {
  Online = "ONLINE",
  InPerson = "IN_PERSON",
  NoPreference = "NO_PREFERENCE",
}
