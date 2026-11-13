import {
  OfficeHoursAppointmentAction,
  OfficeHoursRequestAction,
  type AcademicianAppointment,
  type AcademicianAvailability,
  type OfficeHoursRequest,
} from "@/interfaces/academician-office-hours";
import {
  AppointmentKind,
  AppointmentSide,
  AppointmentStatus,
  type AppointmentTime,
} from "@/interfaces/appointment";
import { Weekday } from "@/interfaces/mentor";

/** Half an hour from "YYYY-MM-DDTHH:mm" in Turkey time. */
export function halfHour(local: string): AppointmentTime {
  const start = new Date(`${local}:00+03:00`);
  const end = new Date(start.getTime() + 30 * 60_000);
  const endLocal = new Date(end.getTime() + 3 * 60 * 60_000)
    .toISOString()
    .slice(0, 16);
  return { startsAt: `${local}:00+03:00`, endsAt: `${endLocal}:00+03:00` };
}

/** Berk Özkan's pending request for one time, answerable in every way. */
export function academicianRequest(
  overrides: Partial<OfficeHoursRequest> = {},
): OfficeHoursRequest {
  return {
    id: "request-1",
    status: AppointmentStatus.Pending,
    student: {
      userId: "student-berk",
      fullName: "Berk Özkan",
      title: null,
      department: "Endüstri Mühendisliği",
      classYear: 4,
    },
    topic: "Yüksek lisans başvurusu",
    note: null,
    courseName: null,
    requestedTimes: [halfHour("2026-11-17T11:00")],
    proposedTimes: [],
    messages: [],
    awaitingStudentReply: false,
    requestedAt: "2026-11-09T09:00:00+03:00",
    allowedActions: [
      OfficeHoursRequestAction.Accept,
      OfficeHoursRequestAction.Decline,
      OfficeHoursRequestAction.ProposeTimes,
    ],
    ...overrides,
  };
}

/** A confirmed appointment with Ayşe Yılmaz the academician may cancel. */
export function academicianAppointment(
  overrides: Partial<AcademicianAppointment> = {},
): AcademicianAppointment {
  return {
    id: "appointment-1",
    requestId: null,
    kind: AppointmentKind.OfficeHours,
    side: AppointmentSide.Mentor,
    status: AppointmentStatus.Confirmed,
    category: null,
    topic: "Ders seçimi ve staj planı",
    counterpart: {
      userId: "student-ayse",
      fullName: "Ayşe Yılmaz",
      title: null,
      department: "Endüstri Mühendisliği",
    },
    place: "A-204",
    onlineUrl: null,
    alternative: null,
    rejectReason: null,
    courseName: null,
    lateCancel: false,
    allowedActions: [OfficeHoursAppointmentAction.Cancel],
    ...halfHour("2026-11-10T10:00"),
    ...overrides,
  };
}

/** Tuesdays 10–12 and Thursdays 14–16 in half-hour slots, nothing else. */
export function academicianAvailability(
  overrides: Partial<AcademicianAvailability> = {},
): AcademicianAvailability {
  return {
    rules: [
      {
        id: "rule-thursday",
        dayOfWeek: Weekday.Thursday,
        startTime: "14:00",
        endTime: "16:00",
        slotMinutes: 30,
      },
      {
        id: "rule-tuesday",
        dayOfWeek: Weekday.Tuesday,
        startTime: "10:00",
        endTime: "12:00",
        slotMinutes: 30,
      },
    ],
    exceptions: [],
    menteeCapacity: null,
    defaultMeetingDurationMinutes: 30,
    meetingBufferMinutes: 0,
    oneOffs: [],
    ...overrides,
  };
}
