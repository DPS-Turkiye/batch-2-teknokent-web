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
  /** Most meeting rooms the transcript bot records at once during a MEETING, platform-wide. */
  recordingLoad: number | null;
  /** Set on the client for a coordinator's proposal still waiting for both sides ("Önerilen slot"). */
  proposalId?: string;
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
  /** How many rooms the transcript bot can record at the same moment. */
  recordingCapacity: number;
};
