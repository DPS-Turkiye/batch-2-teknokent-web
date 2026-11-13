import {
  AppointmentKind,
  AppointmentSide,
  AppointmentStatus,
  type Appointment,
  type AppointmentCounterpart,
  type AppointmentTime,
} from "@/interfaces/appointment";
import type {
  OfficeHoursAcademician,
  StudentOfficeHoursRequestInput,
} from "@/interfaces/student-office-hours";

// Keeps the student's sample Office Hours requests for the session, so sending one shows up on Randevularım and
// an alternative time can be answered. Replaced, not extended, when an Office Hours source is connected.

function counterpart(
  academician: OfficeHoursAcademician,
): AppointmentCounterpart {
  return {
    userId: academician.id,
    fullName: academician.fullName,
    title: academician.academicTitle,
    department: academician.department,
  };
}

// Starts empty: a signed-in student only ever sees the Office Hours requests they sent themselves, never a
// made-up one beside their real peer sessions.
let appointments: Appointment[] = [];
let next = 1;

export function resetStudentOfficeHoursSample() {
  appointments = [];
  next = 1;
}

export function sampleStudentOfficeHoursAppointments() {
  return structuredClone(appointments);
}

export function addSampleOfficeHoursRequest(
  input: StudentOfficeHoursRequestInput,
  academician: OfficeHoursAcademician,
): Appointment {
  if (sampleSlotRequested(academician.id, input.slot.startsAt)) {
    throw new Error("Bu saat için zaten bir talebin var.");
  }
  const created: Appointment = {
    id: `sample-office-hours-request-${next++}`,
    requestId: null,
    kind: AppointmentKind.OfficeHours,
    side: AppointmentSide.Mentee,
    status: AppointmentStatus.Pending,
    category: null,
    topic: input.title,
    counterpart: counterpart(academician),
    ...input.slot,
    place: academician.place,
    onlineUrl: null,
    alternative: null,
    rejectReason: null,
  };
  appointments = [...appointments, created];
  return structuredClone(created);
}

/** The academician's side of the sample: answers a pending request with another time. */
export function proposeSampleOfficeHoursAlternative(
  id: string,
  alternative: AppointmentTime,
) {
  const found = appointments.find((item) => item.id === id);
  if (found?.status !== AppointmentStatus.Pending) {
    throw new Error("Bu talep artık yanıtlanamıyor.");
  }
  const answered: Appointment = {
    ...found,
    status: AppointmentStatus.AlternativeProposed,
    alternative,
  };
  appointments = appointments.map((item) => (item.id === id ? answered : item));
  return structuredClone(answered);
}

/** Accepting moves the request to the proposed time and confirms it; declining withdraws it. */
export function answerSampleOfficeHoursAlternative(
  id: string,
  accept: boolean,
) {
  const found = appointments.find((item) => item.id === id);
  if (
    found?.status !== AppointmentStatus.AlternativeProposed ||
    !found.alternative
  ) {
    throw new Error("Bu talep artık yanıtlanamıyor.");
  }
  const answered: Appointment = accept
    ? {
        ...found,
        ...found.alternative,
        status: AppointmentStatus.Confirmed,
        alternative: null,
      }
    : { ...found, status: AppointmentStatus.Withdrawn };
  appointments = appointments.map((item) => (item.id === id ? answered : item));
  return structuredClone(answered);
}

/** Whether the student already asked this academician for this time (and has not taken it back). */
export function sampleSlotRequested(academicianId: string, startsAt: string) {
  return appointments.some(
    (item) =>
      item.counterpart.userId === academicianId &&
      item.startsAt === startsAt &&
      item.status !== AppointmentStatus.Withdrawn,
  );
}
