/**
 * Mentorluk Ver's tabs once the peer mentor's profile is published (flow 3.2): Menteelerim, Faaliyet Raporum,
 * Mentor Profilim. The value is the URL's `tab`, so report links (`tab=report`) land on the right one.
 */
export enum PeerGiveTab {
  Mentees = "mentees",
  Report = "report",
  Profile = "profile",
}

/** What the "Kapasiten" card says under the bar. */
export enum PeerCapacityNote {
  /** No capacity set: requests keep coming. */
  Unset = "unset",
  Open = "open",
  /** One place left: accepting the next request fills it. */
  LastPlace = "lastPlace",
  Full = "full",
}

/** "Mentor olma adımları", in order; the Mentorluk Ver screens mark where the student is. */
export enum PeerMentorJourneyStep {
  EarnBadge = "earnBadge",
  BadgeVerified = "badgeVerified",
  CreateProfile = "createProfile",
  Published = "published",
}

/** The Mentorluk Al side's tabs. */
export enum PeerTakeTab {
  Discover = "discover",
  Mine = "mine",
}

/** Whether the student can send a mentor a request now. */
export enum PeerRequestAvailability {
  Open = "open",
  /** A request to this mentor is still open. */
  Requested = "requested",
  /** This mentor already mentors the student (an accepted request). */
  Mentoring = "mentoring",
  /** Every place is taken. */
  Full = "full",
}

/** Why an experience card can't be saved yet. */
export enum ExperienceCardProblem {
  Title = "title",
  Organization = "organization",
  Start = "start",
  /** A browser without a month picker shows a text box, where anything can be typed. */
  Month = "month",
  EndBeforeStart = "endBeforeStart",
}

/** The "Yeni deneyim" form as typed; months as "yyyy-MM" (a month input's value). */
export type ExperienceCardForm = {
  title: string;
  organization: string;
  startedOn: string;
  endedOn: string;
  summary: string;
};

/** What the İŞKUR home adds next to the shared student home. */
export enum IskurHomeMode {
  /** Not an İŞKUR student nor a peer mentor (or the badge was taken back): the shared home only. */
  None = "none",
  /** No badge yet: a card pointing to the training. */
  Training = "training",
  /** Badge earned, profile not published yet: a card pointing to the wizard. */
  CreateProfile = "createProfile",
  /** A published peer mentor: "Mentorluk verdiğim" and "Mentor profilin". */
  Mentor = "mentor",
}
