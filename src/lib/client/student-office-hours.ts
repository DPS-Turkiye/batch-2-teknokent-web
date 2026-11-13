import {
  AppointmentKind,
  AppointmentSide,
  AppointmentStatus,
  type Appointment,
} from "@/interfaces/appointment";
import { OfficeHoursRequestStatus } from "@/interfaces/office-hours";
import {
  OfficeHoursStudentAction,
  type OfficeHoursListedAcademician,
  type OfficeHoursStudentRequest,
} from "@/interfaces/office-hours-me";
import type {
  OfficeHoursAcademician,
  StudentOfficeHoursRequestInput,
  StudentOfficeHoursSlot,
} from "@/interfaces/student-office-hours";
import { ClientApiError } from "@/lib/client/api";
import {
  answerOfficeHoursAlternative as answerAlternative,
  getAcademicianOpenSlots,
  getListedAcademician,
  getListedAcademicians,
  getMyOfficeHoursRequests,
  sendOfficeHoursRequest,
} from "@/lib/client/office-hours-me";

// Office Hours for an ODTÜ-signed-in student, through /api/office-hours/me: the academicians who chose to be listed,
// their open slots, and the student's own requests. The screens keep their own shapes; this maps to them.

/** How a request's state reads on Randevularım; a question from the academician still waits on them. */
const APPOINTMENT_STATUS: Record<OfficeHoursRequestStatus, AppointmentStatus> =
  {
    [OfficeHoursRequestStatus.Pending]: AppointmentStatus.Pending,
    [OfficeHoursRequestStatus.MoreInfoRequested]: AppointmentStatus.Pending,
    [OfficeHoursRequestStatus.CounterProposed]:
      AppointmentStatus.AlternativeProposed,
    [OfficeHoursRequestStatus.Accepted]: AppointmentStatus.Confirmed,
    [OfficeHoursRequestStatus.Declined]: AppointmentStatus.Rejected,
    [OfficeHoursRequestStatus.Withdrawn]: AppointmentStatus.Withdrawn,
    [OfficeHoursRequestStatus.Cancelled]: AppointmentStatus.Cancelled,
    [OfficeHoursRequestStatus.Expired]: AppointmentStatus.Expired,
  };

/** The academician's message is a question or the note with their offered times; once settled it says nothing new. */
const MESSAGE_SHOWN = new Set([
  OfficeHoursRequestStatus.MoreInfoRequested,
  OfficeHoursRequestStatus.CounterProposed,
]);

/**
 * Tags, about, topics, courses and response time have no source yet, and where to meet comes only once a request is
 * a meeting; the screens leave out what is empty.
 */
function toAcademician(
  listed: OfficeHoursListedAcademician,
): OfficeHoursAcademician {
  return {
    id: listed.id,
    accountId: listed.accountId,
    fullName: listed.fullName,
    academicTitle: listed.academicTitle,
    department: listed.department,
    faculty: listed.faculty,
    tags: [],
    about: null,
    topics: [],
    courses: [],
    place: null,
    durationMinutes: listed.meetingMinutes,
    responseTime: null,
  };
}

function toAppointment(request: OfficeHoursStudentRequest): Appointment {
  const time = request.time ?? {
    startsAt: request.requestedAt,
    endsAt: request.requestedAt,
  };
  return {
    id: request.id,
    requestId: null,
    kind: AppointmentKind.OfficeHours,
    side: AppointmentSide.Mentee,
    status: APPOINTMENT_STATUS[request.status],
    category: null,
    topic: request.topic,
    counterpart: {
      userId: request.academician.id,
      fullName: request.academician.fullName ?? "",
      title: request.academician.academicTitle,
      department: request.academician.department,
    },
    startsAt: time.startsAt,
    endsAt: time.endsAt,
    place: request.place,
    onlineUrl: request.onlineLink,
    alternative: request.proposedTimes[0] ?? null,
    alternatives: request.proposedTimes,
    rejectReason: request.cancellation?.reason ?? request.rejectionReason,
    counterpartMessage: MESSAGE_SHOWN.has(request.status)
      ? request.academicianMessage
      : null,
    canAcceptAlternative: request.allowedActions.includes(
      OfficeHoursStudentAction.AcceptProposed,
    ),
    canWithdraw: request.allowedActions.includes(
      OfficeHoursStudentAction.Withdraw,
    ),
  };
}

/** A 404 here means "no such listed academician" or "no Office Hours for this account": nothing to show. */
function isNotFound(error: unknown) {
  return error instanceof ClientApiError && error.status === 404;
}

export async function getOfficeHoursAcademicians(): Promise<
  OfficeHoursAcademician[]
> {
  return (await getListedAcademicians()).map(toAcademician);
}

export async function getOfficeHoursAcademician(
  id: string,
): Promise<OfficeHoursAcademician | null> {
  try {
    return toAcademician(await getListedAcademician(id));
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

/**
 * The academician's open slots from `from` (never before now) for `days` days, each as long as their slot; none
 * once they are no longer listed.
 */
export async function getOfficeHoursSlots(
  academicianId: string,
  from: Date,
  days: number,
): Promise<StudentOfficeHoursSlot[]> {
  const until = new Date(from);
  until.setDate(until.getDate() + days);
  const now = new Date();
  const start = from > now ? from : now;
  try {
    return (await getAcademicianOpenSlots(academicianId))
      .filter((slot) => {
        const startsAt = new Date(slot.startsAt);
        return startsAt >= start && startsAt < until;
      })
      .map((slot) => ({ ...slot, available: true }));
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }
}

export async function requestOfficeHours(
  input: StudentOfficeHoursRequestInput,
): Promise<Appointment> {
  return toAppointment(
    await sendOfficeHoursRequest({
      academicianId: input.academicianId,
      startsAt: input.slot.startsAt,
      title: input.title,
      description: input.description || null,
    }),
  );
}

/** The student's Office Hours requests for Randevularım; none for an account without them. */
export async function getStudentOfficeHoursAppointments(): Promise<
  Appointment[]
> {
  try {
    return (await getMyOfficeHoursRequests()).map(toAppointment);
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }
}

/** Takes the academician's other time, or withdraws the request when declining. */
export async function answerOfficeHoursAlternative(
  appointmentId: string,
  accept: boolean,
  time: string | null,
): Promise<Appointment> {
  if (accept && !time) {
    throw new Error("There is no offered time to accept.");
  }
  return toAppointment(
    await answerAlternative(
      appointmentId,
      accept && time ? { accept: true, time } : { accept: false },
    ),
  );
}
