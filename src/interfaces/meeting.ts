export enum MeetingStatus {
  Cancelled = "CANCELLED",
  Completed = "COMPLETED",
  GoogleCalendar = "GOOGLE_CALENDAR",
  Scheduled = "SCHEDULED",
}

export type MeetingItem = {
  id: string;
  organizationId: string;
  mentorId?: string;
  mentorshipRequestId?: string;
  scheduledAt: string;
  durationMinutes: number;
  agenda?: string;
  notes?: string;
  outcomes?: string;
  meetLink?: string;
  status: MeetingStatus | string;
};
