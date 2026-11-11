import type { PeerTopicCategory } from "@/interfaces/peer-mentoring";

/**
 * One appointment as both ODTÜ workspaces list it: a peer-mentoring session or an Office Hours
 * slot. The board's five statuses plus two end states: a request nobody answered in time
 * (Expired) and one the student took back before an answer (Withdrawn).
 */
export enum AppointmentStatus {
  Pending = "PENDING",
  Confirmed = "CONFIRMED",
  Rejected = "REJECTED",
  AlternativeProposed = "ALTERNATIVE_PROPOSED",
  Cancelled = "CANCELLED",
  Expired = "EXPIRED",
  Withdrawn = "WITHDRAWN",
}

export enum AppointmentKind {
  PeerMentoring = "PEER_MENTORING",
  OfficeHours = "OFFICE_HOURS",
}

/** Which side of a peer-mentoring appointment the viewer is on; read from the record, not the account. */
export enum AppointmentSide {
  Mentor = "MENTOR",
  Mentee = "MENTEE",
}

export type AppointmentTime = {
  startsAt: string;
  endsAt: string;
};

export type AppointmentCounterpart = {
  userId: string;
  fullName: string;
  /** Academic title for an academician (e.g. "Dr. Öğr. Üyesi"); null for a student. */
  title: string | null;
  department: string | null;
};

export type Appointment = AppointmentTime & {
  id: string;
  /** The peer-mentoring request the session was booked on; null for Office Hours. */
  requestId: string | null;
  kind: AppointmentKind;
  side: AppointmentSide;
  status: AppointmentStatus;
  /** The peer-mentoring category; null for Office Hours. */
  category: PeerTopicCategory | null;
  topic: string;
  counterpart: AppointmentCounterpart;
  place: string | null;
  onlineUrl: string | null;
  /** Set while the status is AlternativeProposed: the time the other side offered instead. */
  alternative: AppointmentTime | null;
  rejectReason: string | null;
};
