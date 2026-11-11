/** Mentorluk Ver's tabs once the peer mentor's profile is published (Figma 85:454). */
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
  EarnBadge,
  BadgeVerified,
  CreateProfile,
  Published,
}
