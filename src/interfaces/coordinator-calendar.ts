import type { CoordinatorAgendaKind } from "@/interfaces/coordinator-overview";
import type { ProgramCalendarPlanItem } from "@/interfaces/coordinator-program";

/**
 * `id` is the meeting's id for a MEETING, the special day's for a SPECIAL_DAY, one derived from the plan for a
 * SESSION and the program event's otherwise. `plan` is set for a SESSION or SPECIAL_DAY.
 */
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
  plan: ProgramCalendarPlanItem | null;
  /** The mentor marked that the startup did not come to this MEETING. */
  noShow?: boolean;
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
    /** Sessions and special days of the programs' weekly plans in the range. */
    planEntries: number;
  };
  /** How many rooms the transcript bot can record at the same moment. */
  recordingCapacity: number;
};
