import { ActionItemStatus, type ActionItem } from "@/interfaces/action-item";
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

export function isOpenActionItem(item: ActionItem) {
  return (
    item.status === ActionItemStatus.Open ||
    item.status === ActionItemStatus.InProgress
  );
}

export function isOverdueActionItem(item: ActionItem, now = new Date()) {
  if (!isOpenActionItem(item) || !item.dueDate) return false;
  return Date.parse(item.dueDate) < now.getTime();
}

/** Share of a mentorship's action items that are done, or null when it has none. */
export function mentorshipProgress(items: ActionItem[]) {
  const counted = items.filter(
    (item) => item.status !== ActionItemStatus.Cancelled,
  );
  if (counted.length === 0) return null;
  const done = counted.filter(
    (item) => item.status === ActionItemStatus.Completed,
  ).length;
  return Math.round((done / counted.length) * 100);
}

/** A finished meeting with nothing written down still needs the mentor. */
export function meetingsAwaitingReview(
  meetings: MeetingItem[],
  now = new Date(),
) {
  return meetings
    .filter((meeting) => {
      if (meeting.status === MeetingStatus.Cancelled) return false;
      if (Date.parse(meeting.scheduledAt) >= now.getTime()) return false;
      return !meeting.outcomes?.trim() || !meeting.notes?.trim();
    })
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
}
