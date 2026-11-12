/** Mentorluk Ver's tabs once the peer mentor's profile is published. */
export enum PeerGiveTab {
  Requests = "requests",
  Mentees = "mentees",
  Availability = "availability",
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
