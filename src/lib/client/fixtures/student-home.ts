import {
  AppointmentKind,
  AppointmentSide,
  AppointmentStatus,
} from "@/interfaces/appointment";
import type { StudentHome } from "@/interfaces/student-home";

export const STUDENT_HOME_FIXTURE: StudentHome = {
  profileCompleted: false,
  upcomingAppointments: [
    {
      id: "fixture-appointment-1",
      kind: AppointmentKind.PeerMentoring,
      side: AppointmentSide.Mentee,
      status: AppointmentStatus.Confirmed,
      topic: "Staj başvurusu için CV",
      counterpart: {
        userId: "fixture-student-2",
        fullName: "Deniz Kaya",
        title: null,
        department: "Bilgisayar Mühendisliği",
      },
      startsAt: "2026-11-12T11:00:00+03:00",
      endsAt: "2026-11-12T11:45:00+03:00",
      place: null,
      onlineUrl: "https://meet.google.com/abc-defg-hij",
      alternative: null,
      rejectReason: null,
    },
    {
      id: "fixture-appointment-2",
      kind: AppointmentKind.OfficeHours,
      side: AppointmentSide.Mentee,
      status: AppointmentStatus.Pending,
      topic: "Dönem projesi konu seçimi",
      counterpart: {
        userId: "fixture-academician-1",
        fullName: "Ayşe Demir",
        title: "Dr. Öğr. Üyesi",
        department: "Endüstri Mühendisliği",
      },
      startsAt: "2026-11-13T14:00:00+03:00",
      endsAt: "2026-11-13T14:20:00+03:00",
      place: "IE 204",
      onlineUrl: null,
      alternative: null,
      rejectReason: null,
    },
    {
      id: "fixture-appointment-3",
      kind: AppointmentKind.PeerMentoring,
      side: AppointmentSide.Mentor,
      status: AppointmentStatus.AlternativeProposed,
      topic: "Erasmus başvuru süreci",
      counterpart: {
        userId: "fixture-student-3",
        fullName: "Mert Yılmaz",
        title: null,
        department: "Fizik",
      },
      startsAt: "2026-11-14T10:00:00+03:00",
      endsAt: "2026-11-14T10:45:00+03:00",
      place: null,
      onlineUrl: null,
      alternative: {
        startsAt: "2026-11-15T13:00:00+03:00",
        endsAt: "2026-11-15T13:45:00+03:00",
      },
      rejectReason: null,
    },
  ],
};
