export enum MeetingStatus {
  Cancelled = "CANCELLED",
  Completed = "COMPLETED",
  GoogleCalendar = "GOOGLE_CALENDAR",
  Scheduled = "SCHEDULED",
}

export type MeetingItem = {
  id: string;
  organizationId: string;
  organizationName?: string | null;
  mentorId?: string | null;
  mentorName?: string | null;
  mentorshipRequestId?: string | null;
  scheduledAt: string;
  durationMinutes: number;
  agenda?: string | null;
  notes?: string | null | undefined;
  outcomes?: string | null;
  /** Null when the backend has no link; undefined on a calendar import whose event has no link. */
  meetLink?: string | null | undefined;
  transcribeRequested?: boolean;
  botDispatchedAt?: string | null;
  /** Set once the mentor confirms the meeting was held; only these count in the program sessions report. */
  heldConfirmedAt?: string | null;
  status: MeetingStatus;
};
