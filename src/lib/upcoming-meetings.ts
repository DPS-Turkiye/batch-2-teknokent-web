import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";

const HIDDEN_STATUSES = new Set([
  MeetingStatus.Cancelled,
  MeetingStatus.Completed,
]);

function meetingEndMs(meeting: MeetingItem) {
  const startMs = new Date(meeting.scheduledAt).getTime();
  if (!Number.isFinite(startMs)) return Number.NaN;
  const minutes = meeting.durationMinutes > 0 ? meeting.durationMinutes : 60;
  return startMs + minutes * 60_000;
}

export function pickUpcomingMeetings(
  meetings: MeetingItem[],
  options?: { now?: Date; limit?: number },
) {
  const nowMs = (options?.now ?? new Date()).getTime();

  const upcoming = meetings
    .filter((meeting) => {
      if (HIDDEN_STATUSES.has(meeting.status)) return false;
      const endMs = meetingEndMs(meeting);
      return Number.isFinite(endMs) && endMs > nowMs;
    })
    .sort(
      (left, right) =>
        new Date(left.scheduledAt).getTime() -
        new Date(right.scheduledAt).getTime(),
    );

  return {
    nextMeeting: upcoming[0] ?? null,
    upcomingMeetings:
      options?.limit == null ? upcoming : upcoming.slice(0, options.limit),
  };
}
