export enum OfficeHoursRole {
  Instructor = "INSTRUCTOR",
  Student = "STUDENT",
}

export interface OfficeHoursSessionUser {
  userId: string;
  fullName: string;
}

export interface OfficeHoursSessionData {
  user?: OfficeHoursSessionUser;
  issuedAt?: number;
}

export interface LtiLaunchResult {
  userId: string;
  fullName: string;
  courseId: string;
  courseTitle: string;
  role: OfficeHoursRole;
}

export interface OfficeHoursCourse {
  courseId: string;
  title: string;
  shortName: string | null;
  role: OfficeHoursRole;
  userFullName: string;
}

export enum LtiLaunchError {
  Unavailable = "unavailable",
  Rejected = "rejected",
  NoRole = "no-role",
  Expired = "expired",
}

/** The same steps a mentorship request goes through. */
export enum OfficeHoursRequestStatus {
  Pending = "PENDING",
  Accepted = "ACCEPTED",
  Declined = "DECLINED",
  MoreInfoRequested = "MORE_INFO_REQUESTED",
  CounterProposed = "COUNTER_PROPOSED",
  Withdrawn = "WITHDRAWN",
}

/** Still waiting on someone: the student may withdraw these, and they count toward the academic's student limit. */
export const OPEN_OFFICE_HOURS_REQUEST_STATUSES: ReadonlySet<OfficeHoursRequestStatus> =
  new Set([
    OfficeHoursRequestStatus.Pending,
    OfficeHoursRequestStatus.MoreInfoRequested,
    OfficeHoursRequestStatus.CounterProposed,
  ]);

/** The academic answers these; a counter-proposal waits on the student instead. */
export const DECIDABLE_OFFICE_HOURS_REQUEST_STATUSES: ReadonlySet<OfficeHoursRequestStatus> =
  new Set([
    OfficeHoursRequestStatus.Pending,
    OfficeHoursRequestStatus.MoreInfoRequested,
  ]);

export enum OfficeHoursMessageType {
  InstructorQuestion = "INSTRUCTOR_QUESTION",
  StudentReply = "STUDENT_REPLY",
}

export interface OfficeHoursPerson {
  id: string;
  fullName: string;
}

/** A time a student can ask for; startsAt is an ISO instant. */
export interface OfficeHoursSlot {
  startsAt: string;
  durationMinutes: number;
}

export interface OfficeHoursRequest {
  id: string;
  courseId: string;
  status: OfficeHoursRequestStatus;
  student: OfficeHoursPerson;
  instructor: OfficeHoursPerson;
  topic: string;
  expectedOutcome: string | null;
  /** "yyyy-MM-ddTHH:mm" in Turkey time, as mentorship requests carry them. */
  preferredSlots: string[];
  proposedSlots: string[];
  instructorMessage: string | null;
  rejectionReason: string | null;
  messages: {
    id: string;
    authorId: string;
    type: OfficeHoursMessageType;
    body: string;
    createdAt: string;
  }[];
  meeting: OfficeHoursSlot | null;
  createdAt: string;
}

export interface OfficeHoursMeeting {
  id: string;
  requestId: string;
  scheduledAt: string;
  durationMinutes: number;
  student: OfficeHoursPerson;
  instructor: OfficeHoursPerson;
  topic: string;
}

export interface CreateOfficeHoursRequestPayload {
  instructorId: string;
  topic: string;
  expectedOutcome?: string | undefined;
  preferredSlots: string[];
}

export type OfficeHoursDecisionPayload =
  | {
      status: OfficeHoursRequestStatus.Accepted;
      slot: string;
      message?: string | undefined;
    }
  | { status: OfficeHoursRequestStatus.Declined; message?: string | undefined }
  | { status: OfficeHoursRequestStatus.MoreInfoRequested; message: string }
  | {
      status: OfficeHoursRequestStatus.CounterProposed;
      proposedSlots: string[];
      message?: string | undefined;
    };
