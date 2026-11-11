/** Randevularım's role filter for students who both take and give peer mentoring. */
export enum AppointmentRoleFilter {
  All = "all",
  /** Meetings where the student is the peer mentor. */
  AsMentor = "asMentor",
  /** Peer-mentoring and Office Hours meetings the student takes. */
  AsMentee = "asMentee",
}
