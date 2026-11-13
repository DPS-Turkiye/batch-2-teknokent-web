import type {
  Appointment,
  AppointmentCounterpart,
  AppointmentStatus,
  AppointmentTime,
} from "@/interfaces/appointment";
import type {
  MentorAvailabilitySettings,
  UpdateMentorAvailabilitySettingsPayload,
} from "@/interfaces/mentor";

/**
 * The academician's side of Office Hours, shaped so either source can fill it: Göksu's
 * Moodle-course backend once an ODTÜ account is linked to its Moodle user, or an Office Hours
 * service on Menton accounts. Each source states what the academician may do through
 * `allowedActions`, so a screen never assumes one backend's rules.
 */

/** Answers to a request. AskQuestion exists only where the source has a question step. */
export enum OfficeHoursRequestAction {
  Accept = "ACCEPT",
  Decline = "DECLINE",
  ProposeTimes = "PROPOSE_TIMES",
  AskQuestion = "ASK_QUESTION",
}

/** What may still happen to a confirmed appointment; empty where the source cannot cancel. */
export enum OfficeHoursAppointmentAction {
  Cancel = "CANCEL",
}

export enum OfficeHoursMessageAuthor {
  Academician = "ACADEMICIAN",
  Student = "STUDENT",
}

export type OfficeHoursMessage = {
  author: OfficeHoursMessageAuthor;
  body: string;
  sentAt: string;
};

/** The student behind a request, with the class year the academician sees next to the name ("4. sınıf"). */
export type OfficeHoursStudent = AppointmentCounterpart & {
  classYear: number | null;
};

/** The most times an academician may offer instead in one answer. */
export const MAX_PROPOSED_TIMES = 3;

export type OfficeHoursRequest = {
  id: string;
  /** Pending while it waits for the academician, AlternativeProposed while it waits for the student. */
  status: AppointmentStatus;
  student: OfficeHoursStudent;
  topic: string;
  /** The student's note or expected outcome. */
  note: string | null;
  /** The course it came from, when the source is course-based. */
  courseName: string | null;
  /** One time, or up to three preferred times, depending on the source. */
  requestedTimes: AppointmentTime[];
  /** Times the academician offered instead; set while AlternativeProposed. */
  proposedTimes: AppointmentTime[];
  /** A question to the student and their answer, where the source has that step. */
  messages: OfficeHoursMessage[];
  /** True while the request waits for the student's answer to a question. */
  awaitingStudentReply: boolean;
  requestedAt: string;
  allowedActions: OfficeHoursRequestAction[];
};

export type OfficeHoursAnswer =
  | { action: OfficeHoursRequestAction.Accept; time: AppointmentTime }
  | { action: OfficeHoursRequestAction.Decline; reason: string | null }
  | {
      action: OfficeHoursRequestAction.ProposeTimes;
      times: AppointmentTime[];
      note: string | null;
    }
  | { action: OfficeHoursRequestAction.AskQuestion; question: string };

/** A row of the academician's Randevularım; `side` is always the host (Mentor) side. */
export type AcademicianAppointment = Appointment & {
  courseName: string | null;
  /** True when it was cancelled close to its start. */
  lateCancel: boolean;
  allowedActions: OfficeHoursAppointmentAction[];
};

/** One-off office hours on a date, next to the weekly ranges. */
export type OfficeHoursOneOff = AppointmentTime & {
  id?: string;
  place: string | null;
};

/**
 * Weekly ranges, days off and the number fields in the mentor settings shape the shared
 * availability editor already edits (menteeCapacity is the student limit, the default meeting
 * length is the slot length), plus one-off hours.
 */
export type AcademicianAvailability = MentorAvailabilitySettings & {
  oneOffs: OfficeHoursOneOff[];
};

export type UpdateAcademicianAvailabilityPayload =
  UpdateMentorAvailabilitySettingsPayload & {
    oneOffs: Omit<OfficeHoursOneOff, "id">[];
  };

/** What the academician sets for students; title and department come from ODTÜ's record. */
export type OfficeHoursProfileSettings = {
  defaultPlace: string | null;
  onlineLink: string | null;
  /** Shown to students only when filled in. */
  contactEmail: string | null;
};
