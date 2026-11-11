import {
  OfficeHoursAppointmentAction,
  OfficeHoursMessageAuthor,
  OfficeHoursRequestAction,
  type AcademicianAppointment,
  type AcademicianAvailability,
  type OfficeHoursProfileSettings,
  type OfficeHoursRequest,
} from "@/interfaces/academician-office-hours";
import {
  AppointmentKind,
  AppointmentSide,
  AppointmentStatus,
  type AppointmentCounterpart,
  type AppointmentTime,
} from "@/interfaces/appointment";
import { Weekday } from "@/interfaces/mentor";

// Sample data for the academician workspace until an Office Hours source is connected. Times
// are relative to today (Turkey time) so "upcoming" stays upcoming; nothing here is real.

const TURKEY_OFFSET_MS = 3 * 60 * 60 * 1000;

/** "YYYY-MM-DDTHH:mm:00+03:00", `days` from today in Turkey time. */
export function sampleTime(days: number, hour: number, minute = 0) {
  const today = new Date(Date.now() + TURKEY_OFFSET_MS);
  today.setUTCDate(today.getUTCDate() + days);
  const date = today.toISOString().slice(0, 10);
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${date}T${hh}:${mm}:00+03:00`;
}

function slot(days: number, hour: number, minute = 0, minutes = 30) {
  const end = hour * 60 + minute + minutes;
  return {
    startsAt: sampleTime(days, hour, minute),
    endsAt: sampleTime(days, Math.floor(end / 60), end % 60),
  } satisfies AppointmentTime;
}

function student(
  userId: string,
  fullName: string,
  department: string,
): AppointmentCounterpart {
  return { userId, fullName, title: null, department };
}

const DENIZ = student(
  "sample-student-deniz",
  "Deniz Kaya",
  "Bilgisayar Mühendisliği",
);
const ECE = student(
  "sample-student-ece",
  "Ece Aksoy",
  "Bilgisayar Mühendisliği",
);
const MERT = student(
  "sample-student-mert",
  "Mert Demir",
  "Elektrik-Elektronik Mühendisliği",
);
const ZEYNEP = student(
  "sample-student-zeynep",
  "Zeynep Arslan",
  "Bilgisayar Mühendisliği",
);

const ANSWERS = [
  OfficeHoursRequestAction.Accept,
  OfficeHoursRequestAction.Decline,
  OfficeHoursRequestAction.ProposeTimes,
];

export const ACADEMICIAN_REQUESTS_SAMPLE: OfficeHoursRequest[] = [
  {
    id: "sample-request-1",
    status: AppointmentStatus.Pending,
    student: DENIZ,
    topic: "2. ödevdeki 3. soruda takıldım",
    note: null,
    courseName: null,
    requestedTimes: [slot(1, 14)],
    proposedTimes: [],
    messages: [],
    awaitingStudentReply: false,
    requestedAt: sampleTime(-1, 9, 15),
    allowedActions: ANSWERS,
  },
  {
    id: "sample-request-2",
    status: AppointmentStatus.Pending,
    student: ECE,
    topic: "Dönem projesi için konu seçimi",
    note: "Hangi konunun bir dönemde bitebileceğini netleştirmek istiyorum.",
    courseName: "CENG 101 · Introduction to Computing",
    requestedTimes: [slot(2, 10), slot(2, 10, 30), slot(4, 14)],
    proposedTimes: [],
    messages: [],
    awaitingStudentReply: false,
    requestedAt: sampleTime(-1, 16, 40),
    allowedActions: [...ANSWERS, OfficeHoursRequestAction.AskQuestion],
  },
  {
    id: "sample-request-3",
    status: AppointmentStatus.Pending,
    student: MERT,
    topic: "Vize notuma itiraz",
    note: null,
    courseName: "EE 201 · Circuit Theory",
    requestedTimes: [slot(3, 15)],
    proposedTimes: [],
    messages: [
      {
        author: OfficeHoursMessageAuthor.Academician,
        body: "Hangi soruya itiraz ediyorsun?",
        sentAt: sampleTime(0, 9),
      },
    ],
    awaitingStudentReply: true,
    requestedAt: sampleTime(-2, 11),
    allowedActions: ANSWERS,
  },
  {
    id: "sample-request-4",
    status: AppointmentStatus.AlternativeProposed,
    student: ZEYNEP,
    topic: "Staj başvurusu için referans",
    note: null,
    courseName: null,
    requestedTimes: [slot(1, 9)],
    proposedTimes: [slot(5, 11)],
    messages: [],
    awaitingStudentReply: false,
    requestedAt: sampleTime(-3, 13),
    allowedActions: [],
  },
];

function appointment(
  id: string,
  counterpart: AppointmentCounterpart,
  topic: string,
  time: AppointmentTime,
  status: AppointmentStatus,
  extra: Partial<AcademicianAppointment> = {},
): AcademicianAppointment {
  return {
    id,
    requestId: null,
    category: null,
    kind: AppointmentKind.OfficeHours,
    side: AppointmentSide.Mentor,
    status,
    topic,
    counterpart,
    place: "A-204",
    onlineUrl: null,
    alternative: null,
    rejectReason: null,
    courseName: null,
    lateCancel: false,
    allowedActions:
      status === AppointmentStatus.Confirmed
        ? [OfficeHoursAppointmentAction.Cancel]
        : [],
    ...time,
    ...extra,
  };
}

export const ACADEMICIAN_APPOINTMENTS_SAMPLE: AcademicianAppointment[] = [
  appointment(
    "sample-appointment-1",
    ZEYNEP,
    "Bitirme projesi danışmanlığı",
    slot(0, 15, 30),
    AppointmentStatus.Confirmed,
  ),
  appointment(
    "sample-appointment-2",
    DENIZ,
    "Final öncesi tekrar",
    slot(2, 14),
    AppointmentStatus.Confirmed,
    { onlineUrl: "https://meet.example.org/ofis-saati" },
  ),
  appointment(
    "sample-appointment-3",
    ECE,
    "Ödev 2 geri bildirimi",
    slot(3, 11),
    AppointmentStatus.Confirmed,
    // A course-based source books meetings it cannot cancel.
    { courseName: "CENG 101 · Introduction to Computing", allowedActions: [] },
  ),
  appointment(
    "sample-appointment-4",
    MERT,
    "Laboratuvar raporu",
    slot(1, 10),
    AppointmentStatus.Cancelled,
    { lateCancel: true, rejectReason: "Fakülte kurulu toplantısı" },
  ),
  appointment(
    "sample-appointment-5",
    ECE,
    "Kariyer planı",
    slot(-2, 14),
    AppointmentStatus.Confirmed,
    { allowedActions: [] },
  ),
];

export const ACADEMICIAN_AVAILABILITY_SAMPLE: AcademicianAvailability = {
  rules: [
    {
      id: "sample-rule-1",
      dayOfWeek: Weekday.Tuesday,
      startTime: "14:00",
      endTime: "16:00",
      slotMinutes: 30,
    },
    {
      id: "sample-rule-2",
      dayOfWeek: Weekday.Thursday,
      startTime: "10:00",
      endTime: "12:00",
      slotMinutes: 30,
    },
  ],
  exceptions: [
    {
      id: "sample-exception-1",
      startsOn: sampleTime(10, 0).slice(0, 10),
      endsOn: sampleTime(12, 0).slice(0, 10),
      reason: "Konferans",
    },
  ],
  menteeCapacity: null,
  defaultMeetingDurationMinutes: 30,
  meetingBufferMinutes: 0,
  oneOffs: [{ id: "sample-one-off-1", ...slot(6, 13, 0, 120), place: "B-110" }],
};

export const OFFICE_HOURS_PROFILE_SAMPLE: OfficeHoursProfileSettings = {
  defaultPlace: "A-204",
  onlineLink: null,
  contactEmail: null,
};
