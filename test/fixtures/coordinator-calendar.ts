import type {
  CoordinatorCalendar,
  CoordinatorCalendarItem,
} from "@/interfaces/coordinator-calendar";
import { CoordinatorAgendaKind } from "@/interfaces/coordinator-overview";

/** Local time on a day of the week of 14 September 2026 (Monday). */
export function at(dayOfWeek: number, hour: number, minute = 0) {
  return new Date(2026, 8, 14 + dayOfWeek, hour, minute).toISOString();
}

export function calendarMeeting(
  overrides: Partial<CoordinatorCalendarItem> = {},
): CoordinatorCalendarItem {
  return {
    id: "meeting-1",
    kind: CoordinatorAgendaKind.Meeting,
    title: "Mentorluk görüşmesi",
    startsAt: at(2, 14),
    endsAt: at(2, 15),
    programId: "program-1",
    programName: "METU Stars 2026",
    mentorshipId: "mentorship-1",
    mentorId: "mentor-1",
    mentorName: "Nihan Öztürk",
    organizationId: "org-1",
    organizationName: "Atlas AI",
    topic: "Ürün stratejisi",
    sequence: 5,
    meetLink: "https://meet.google.com/abc",
    description: null,
    conflict: false,
    ...overrides,
  };
}

export function calendarEvent(
  overrides: Partial<CoordinatorCalendarItem> = {},
): CoordinatorCalendarItem {
  return {
    ...calendarMeeting(),
    id: "event-1",
    kind: CoordinatorAgendaKind.Event,
    title: "Ürün-Pazar Uyumu Atölyesi",
    startsAt: at(1, 16),
    endsAt: at(1, 17),
    mentorshipId: null,
    mentorId: null,
    mentorName: null,
    organizationId: null,
    organizationName: null,
    topic: null,
    sequence: null,
    meetLink: null,
    ...overrides,
  };
}

export function coordinatorCalendar(
  overrides: Partial<CoordinatorCalendar> = {},
): CoordinatorCalendar {
  return {
    from: "2026-09-14",
    to: "2026-09-20",
    items: [
      calendarEvent(),
      calendarMeeting(),
      calendarMeeting({
        id: "nova",
        mentorId: "mentor-2",
        mentorName: "Ahmet Can",
        organizationName: "Nova Robotics",
        startsAt: at(2, 11),
        endsAt: at(2, 12),
        conflict: true,
      }),
      calendarMeeting({
        id: "vega",
        mentorId: "mentor-2",
        mentorName: "Ahmet Can",
        organizationName: "Vega",
        startsAt: at(2, 11, 30),
        endsAt: at(2, 12, 30),
        conflict: true,
      }),
    ],
    conflicts: [
      {
        mentorId: "mentor-2",
        mentorName: "Ahmet Can",
        meetingIds: ["nova", "vega"],
      },
    ],
    summary: { meetings: 3, events: 1, deadlines: 0, unscheduledRisky: 2 },
    ...overrides,
  };
}
