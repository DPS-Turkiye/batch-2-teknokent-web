import type {
  AcademicianAppointment,
  OfficeHoursRequest,
} from "@/interfaces/academician-office-hours";
import { AppointmentStatus } from "@/interfaces/appointment";
import type {
  InstitutionPersonSummary,
  StudyLevel,
} from "@/interfaces/institution";
import { pendingRequests } from "@/lib/academician-calendar";
import { byStart, waitsForAcademician } from "@/lib/academician-office-hours";
import {
  AdviseeNextKind,
  StudentHistoryBadge,
} from "@/types/academician-office-hours";

type Source = {
  requests: readonly OfficeHoursRequest[];
  appointments: readonly AcademicianAppointment[];
};

/** The Menton ids of the academician's advisees; people who never signed in have none to match. */
export function adviseeIds(advisees: readonly InstitutionPersonSummary[]) {
  return new Set(
    advisees.flatMap((advisee) =>
      advisee.userId === null ? [] : [advisee.userId],
    ),
  );
}

/** Advisees whose name contains the search, in Turkish alphabetical order ("ı" and "İ" fold as Turkish does). */
export function filterAdvisees(
  advisees: readonly InstitutionPersonSummary[],
  search: string,
) {
  const needle = search.trim().toLocaleLowerCase("tr");
  return advisees
    .filter(
      (person) =>
        needle === "" ||
        person.fullName.toLocaleLowerCase("tr").includes(needle),
    )
    .toSorted((a, b) => a.fullName.localeCompare(b.fullName, "tr"));
}

export type AdviseeRow = {
  person: InstitutionPersonSummary;
  /** The start of the latest appointment that is over. */
  lastAppointmentAt: string | null;
  /** The next booked appointment, or else the earliest time a waiting request asks for. */
  next: { kind: AdviseeNextKind; startsAt: string } | null;
};

function bookedWith(appointments: Source["appointments"], userId: string) {
  return appointments.filter(
    (appointment) =>
      appointment.status === AppointmentStatus.Confirmed &&
      appointment.counterpart.userId === userId,
  );
}

function waitingFrom(requests: Source["requests"], userId: string) {
  return requests.filter(
    (request) =>
      request.student.userId === userId && waitsForAcademician(request),
  );
}

/** Each advisee with the last and next time they meet the academician. Unknown to Menton means nothing to show. */
export function adviseeRows(
  advisees: readonly InstitutionPersonSummary[],
  { requests, appointments }: Source,
  now: Date,
): AdviseeRow[] {
  return advisees.map((person) => {
    if (person.userId === null) {
      return { person, lastAppointmentAt: null, next: null };
    }
    const booked = bookedWith(appointments, person.userId).toSorted(byStart);
    const over = booked.filter(
      (appointment) => Date.parse(appointment.endsAt) <= now.getTime(),
    );
    const upcoming = booked.find(
      (appointment) => Date.parse(appointment.endsAt) > now.getTime(),
    );
    const waitingTime = waitingFrom(requests, person.userId)
      .flatMap((request) => request.requestedTimes)
      .toSorted(byStart)[0];
    let next: AdviseeRow["next"] = null;
    if (upcoming) {
      next = { kind: AdviseeNextKind.Appointment, startsAt: upcoming.startsAt };
    } else if (waitingTime) {
      next = {
        kind: AdviseeNextKind.PendingRequest,
        startsAt: waitingTime.startsAt,
      };
    }
    return {
      person,
      lastAppointmentAt: over.at(-1)?.startsAt ?? null,
      next,
    };
  });
}

export type StudentHistoryItem = {
  key: string;
  title: string;
  startsAt: string;
  badge: StudentHistoryBadge;
};

export type StudentProfile = {
  userId: string;
  fullName: string;
  department: string | null;
  classYear: number | null;
  programLevel: StudyLevel | null;
  isAdvisee: boolean;
  /** The request that waits for the academician's answer, the soonest first. */
  pendingRequest: OfficeHoursRequest | null;
  /** Requests and appointments with the academician, newest first. */
  history: StudentHistoryItem[];
};

function appointmentBadge(appointment: AcademicianAppointment, now: Date) {
  if (appointment.status === AppointmentStatus.Cancelled) {
    return StudentHistoryBadge.Cancelled;
  }
  return Date.parse(appointment.endsAt) <= now.getTime()
    ? StudentHistoryBadge.Completed
    : StudentHistoryBadge.Confirmed;
}

/**
 * What the academician may see of a student: ODTÜ's record when the student is an advisee, otherwise what their
 * requests and appointments carry, and only their meetings with this academician. Null when nothing is known.
 */
export function studentProfile(
  userId: string,
  {
    advisees,
    requests,
    appointments,
  }: Source & { advisees: readonly InstitutionPersonSummary[] },
  now: Date,
): StudentProfile | null {
  const advisee = advisees.find((person) => person.userId === userId);
  const theirRequests = requests.filter(
    (request) => request.student.userId === userId,
  );
  const theirAppointments = appointments.filter(
    (appointment) =>
      appointment.counterpart.userId === userId &&
      (appointment.status === AppointmentStatus.Confirmed ||
        appointment.status === AppointmentStatus.Cancelled),
  );
  const [fromRequest] = theirRequests;
  const [fromAppointment] = theirAppointments;
  const fullName =
    advisee?.fullName ??
    fromRequest?.student.fullName ??
    fromAppointment?.counterpart.fullName;
  if (fullName === undefined) return null;

  const openRequests = theirRequests.filter(
    (request) =>
      waitsForAcademician(request) ||
      request.status === AppointmentStatus.AlternativeProposed,
  );
  const requestItems = openRequests.flatMap((request): StudentHistoryItem[] => {
    const [time] = waitsForAcademician(request)
      ? request.requestedTimes
      : request.proposedTimes;
    if (time === undefined) return [];
    return [
      {
        key: request.id,
        title: request.topic,
        startsAt: time.startsAt,
        badge: waitsForAcademician(request)
          ? StudentHistoryBadge.Pending
          : StudentHistoryBadge.Proposed,
      },
    ];
  });
  const appointmentItems = theirAppointments.map(
    (appointment): StudentHistoryItem => ({
      key: appointment.id,
      title: appointment.topic,
      startsAt: appointment.startsAt,
      badge: appointmentBadge(appointment, now),
    }),
  );

  return {
    userId,
    fullName,
    department:
      advisee?.departmentName ??
      fromRequest?.student.department ??
      fromAppointment?.counterpart.department ??
      null,
    classYear: advisee?.classYear ?? fromRequest?.student.classYear ?? null,
    programLevel: advisee?.programLevel ?? null,
    isAdvisee: advisee !== undefined,
    pendingRequest: pendingRequests(theirRequests)[0] ?? null,
    history: [...requestItems, ...appointmentItems].toSorted(
      (a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt),
    ),
  };
}
