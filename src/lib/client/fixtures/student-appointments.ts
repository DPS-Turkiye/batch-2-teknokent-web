import { AppointmentStatus, type Appointment } from "@/interfaces/appointment";
import { STUDENT_HOME_FIXTURE } from "@/lib/client/fixtures/student-home";

// Shared display examples, including an Office Hours row; not a booking source.
export const STUDENT_APPOINTMENTS_FIXTURE: Appointment[] = [
  ...STUDENT_HOME_FIXTURE.upcomingAppointments,
  {
    ...STUDENT_HOME_FIXTURE.upcomingAppointments[0],
    id: "fixture-cancelled-appointment",
    topic: "Kariyer planı üzerine görüşme",
    status: AppointmentStatus.Cancelled,
    startsAt: "2026-11-10T11:00:00+03:00",
    endsAt: "2026-11-10T11:45:00+03:00",
    onlineUrl: null,
  },
];
