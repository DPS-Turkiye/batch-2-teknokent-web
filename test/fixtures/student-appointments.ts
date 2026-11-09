import {
  type Appointment,
  AppointmentKind,
  AppointmentSide,
  AppointmentStatus,
} from "@/interfaces/appointment";
import { PeerTopicCategory } from "@/interfaces/peer-mentoring";

/** A booked peer session as the backend lists it; override what the test is about. */
export function peerAppointment(
  overrides: Partial<Appointment> = {},
): Appointment {
  return {
    id: "meeting-1",
    requestId: "request-1",
    kind: AppointmentKind.PeerMentoring,
    side: AppointmentSide.Mentee,
    status: AppointmentStatus.Confirmed,
    category: PeerTopicCategory.CareerInternship,
    topic: "Staj başvurusu için CV'me bakar mısın?",
    counterpart: {
      userId: "student-2",
      fullName: "Zeynep Demir",
      title: null,
      department: "Bilgisayar Mühendisliği",
    },
    startsAt: "2026-11-12T08:00:00.000Z",
    endsAt: "2026-11-12T08:45:00.000Z",
    place: null,
    onlineUrl: "https://meet.google.com/abc-defg-hij",
    alternative: null,
    rejectReason: null,
    ...overrides,
  };
}

/** Two ahead (one as mentor), one held, one cancelled: Randevularım's sections and filters. */
export const STUDENT_APPOINTMENTS: Appointment[] = [
  peerAppointment(),
  peerAppointment({
    id: "meeting-2",
    requestId: "request-2",
    side: AppointmentSide.Mentor,
    category: PeerTopicCategory.International,
    topic: "Erasmus başvuru süreci",
    counterpart: {
      userId: "student-3",
      fullName: "Mert Yılmaz",
      title: null,
      department: "Fizik",
    },
    startsAt: "2026-11-11T11:00:00.000Z",
    endsAt: "2026-11-11T11:30:00.000Z",
    onlineUrl: null,
  }),
  peerAppointment({
    id: "meeting-3",
    requestId: "request-3",
    category: PeerTopicCategory.AcademicDevelopment,
    topic: "Vize haftası çalışma planı",
    startsAt: "2026-11-02T09:00:00.000Z",
    endsAt: "2026-11-02T09:45:00.000Z",
  }),
  peerAppointment({
    id: "meeting-4",
    requestId: "request-4",
    status: AppointmentStatus.Cancelled,
    category: PeerTopicCategory.CampusLife,
    topic: "Kulüp seçimi",
    startsAt: "2026-11-15T09:00:00.000Z",
    endsAt: "2026-11-15T09:30:00.000Z",
  }),
];

/** The fixed "now" these tests read the list at. */
export const APPOINTMENTS_NOW = new Date("2026-11-09T09:00:00.000Z");
