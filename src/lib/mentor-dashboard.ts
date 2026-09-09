import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";

/** Calendar weeks follow the availability service's Istanbul business timezone. */
export function mentorWeekMeetingCount(
  meetings: MeetingItem[],
  now = new Date(),
) {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const start = new Date(`${day}T00:00:00+03:00`);
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  start.setUTCDate(start.getUTCDate() - ((weekday + 6) % 7));
  const end = start.getTime() + 7 * 86_400_000;
  return meetings.filter((meeting) => {
    const time = Date.parse(meeting.scheduledAt);
    return (
      meeting.status !== MeetingStatus.Cancelled &&
      time >= start.getTime() &&
      time < end
    );
  }).length;
}
