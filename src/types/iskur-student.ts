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
