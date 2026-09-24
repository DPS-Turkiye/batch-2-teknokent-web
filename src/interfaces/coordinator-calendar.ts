import type { CoordinatorAgendaKind } from "@/interfaces/coordinator-overview";

/** `id` is the meeting's id for a MEETING and the program event's id otherwise. */
export type CoordinatorCalendarItem = {
  id: string;
  kind: CoordinatorAgendaKind;
  title: string;
  startsAt: string;
  endsAt: string | null;
  programId: string;
  programName: string;
  mentorshipId: string | null;
  mentorId: string | null;
  mentorName: string | null;
  organizationId: string | null;
  organizationName: string | null;
  topic: string | null;
  sequence: number | null;
  meetLink: string | null;
  description: string | null;
  conflict: boolean;
};

/** Meetings of one mentor that overlap in time. */
export type CoordinatorCalendarConflict = {
  mentorId: string;
  mentorName: string;
  meetingIds: string[];
};

/** The coordinator's Takvim (`GET /api/coordinator/calendar`). */
export type CoordinatorCalendar = {
  from: string;
  to: string;
  items: CoordinatorCalendarItem[];
  conflicts: CoordinatorCalendarConflict[];
  summary: {
    meetings: number;
    events: number;
    deadlines: number;
    unscheduledRisky: number;
  };
};
