import type { OfficeHoursRequestAction } from "@/interfaces/academician-office-hours";
import type {
  OfficeHoursRequestStatus,
  OfficeHoursRole,
} from "@/interfaces/office-hours";

/**
 * Office hours for a Menton account signed in through ODTÜ (backend `/api/office-hours/me`), with no Moodle launch.
 * These are the backend's shapes; the screens' own types are filled from them in `lib/client`.
 */

/** A time range; both ends are ISO times with Turkey's offset ("2026-11-24T14:00:00+03:00"). */
export type OfficeHoursTimeRange = {
  startsAt: string;
  endsAt: string;
};

/** What the student may still do with their request; the academician's answers are `OfficeHoursRequestAction`. */
export enum OfficeHoursStudentAction {
  AcceptProposed = "ACCEPT_PROPOSED",
  Withdraw = "WITHDRAW",
  Reply = "REPLY",
}

/**
 * The student behind a request, as only the academician it was sent to sees them: `id` is always their
 * office-hours id; `accountId` their Menton account, or null for a student who came in only through Moodle.
 */
export type OfficeHoursRequestStudent = {
  id: string;
  accountId: string | null;
  fullName: string;
  department: string | null;
  classYear: number | null;
};

export type OfficeHoursInboxMessage = {
  author: OfficeHoursRole;
  body: string;
  sentAt: string;
};

/** Who called a meeting off, why, when, and whether it was close to its start (FR-OH-14). */
export type OfficeHoursCancellation = {
  cancelledById: string;
  reason: string | null;
  cancelledAt: string;
  late: boolean;
};

/** A request in the academician's inbox, from Menton (`courseName` null) or from a Moodle course. */
export type OfficeHoursInboxRequest = {
  id: string;
  status: OfficeHoursRequestStatus;
  student: OfficeHoursRequestStudent;
  topic: string;
  note: string | null;
  courseName: string | null;
  requestedTimes: OfficeHoursTimeRange[];
  proposedTimes: OfficeHoursTimeRange[];
  messages: OfficeHoursInboxMessage[];
  meeting: OfficeHoursTimeRange | null;
  rejectionReason: string | null;
  requestedAt: string;
  allowedActions: OfficeHoursRequestAction[];
  /** Set on a cancelled request, once the backend sends cancellations (Göksu's cancel work). */
  cancellation?: OfficeHoursCancellation | null | undefined;
};

/** The academician's answer; `message` is the reason, the note with the offered times, or the question. */
export type OfficeHoursAnswerInput = {
  action: OfficeHoursRequestAction;
  time?: string | undefined;
  times?: string[] | undefined;
  message?: string | null | undefined;
};

export type OfficeHoursAcademicianMeeting = {
  id: string;
  requestId: string;
  startsAt: string;
  endsAt: string;
  student: OfficeHoursRequestStudent;
  topic: string | null;
  courseName: string | null;
  place: string | null;
  onlineLink: string | null;
};

/** Whether students see the academician (`listed`, off by default) and where and how to meet them. */
export type OfficeHoursProfile = {
  listed: boolean;
  defaultPlace: string | null;
  onlineLink: string | null;
  contactEmail: string | null;
};

/**
 * A listed academician as a student browses them; `accountId` tells the student's advisor apart. Where to meet and
 * the online link come only on the student's own request, once it is a meeting.
 */
export type OfficeHoursListedAcademician = {
  id: string;
  accountId: string;
  fullName: string;
  academicTitle: string | null;
  department: string | null;
  faculty: string | null;
  contactEmail: string | null;
  meetingMinutes: number;
};

export type OfficeHoursRequestInput = {
  academicianId: string;
  startsAt: string;
  title: string;
  description: string | null;
};

/** One of the student's own requests; place and online link only once it is a meeting. */
export type OfficeHoursStudentRequest = {
  id: string;
  status: OfficeHoursRequestStatus;
  academician: {
    id: string;
    fullName: string | null;
    academicTitle: string | null;
    department: string | null;
  };
  topic: string;
  description: string | null;
  courseName: string | null;
  time: OfficeHoursTimeRange | null;
  proposedTimes: OfficeHoursTimeRange[];
  academicianMessage: string | null;
  rejectionReason: string | null;
  place: string | null;
  onlineLink: string | null;
  requestedAt: string;
  allowedActions: OfficeHoursStudentAction[];
  /** Set on a cancelled request, once the backend sends cancellations (Göksu's cancel work). */
  cancellation?: OfficeHoursCancellation | null | undefined;
};

/** Take one of the academician's offered times (`accept` with `time`), or withdraw the request. */
export type OfficeHoursAlternativeInput = {
  accept: boolean;
  time?: string | undefined;
};
