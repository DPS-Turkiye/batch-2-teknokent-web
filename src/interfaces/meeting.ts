export enum MeetingStatus {
  Cancelled = "CANCELLED",
  Completed = "COMPLETED",
  GoogleCalendar = "GOOGLE_CALENDAR",
  Scheduled = "SCHEDULED",
}

export type MeetingItem = {
  id: string;
  organizationId: string;
  organizationName?: string;
  mentorId?: string;
  mentorName?: string;
  mentorshipRequestId?: string;
  scheduledAt: string;
  durationMinutes: number;
  agenda?: string;
  notes?: string;
  outcomes?: string;
  meetLink?: string;
  transcribeRequested?: boolean;
  botDispatchedAt?: string | null;
  /** Set once the mentor confirms the meeting was held; only these count in the program sessions report. */
  heldConfirmedAt?: string | null;
  status: MeetingStatus | string;
};
