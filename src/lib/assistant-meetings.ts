import {
  MeetingStatus as CalendarStatus,
  type MeetingItem,
} from "@/interfaces/meeting";
import { TRANSCRIPT_BOT_LEAD_MS } from "@/lib/const";
import { formatSlotDateTime } from "@/lib/format";
import { parseMeetingUrl, sameMeetingUrl } from "@/lib/meeting-url";
import {
  MeetingPlatform,
  MeetingStatus,
  type Meeting,
} from "@/types/assistant";

export function isAssistantCalendarMeeting(item: MeetingItem): boolean {
  if (item.status === CalendarStatus.Cancelled) return false;
  return Boolean(
    item.meetLink?.trim() || item.transcribeRequested || item.botDispatchedAt,
  );
}

export function assistantStatusFor(
  item: MeetingItem,
  now = Date.now(),
): MeetingStatus {
  if (item.status === CalendarStatus.Completed) return MeetingStatus.Completed;
  if (item.status === CalendarStatus.Cancelled) return MeetingStatus.Failed;
  const start = Date.parse(item.scheduledAt);
  const end = start + item.durationMinutes * 60_000;
  if (Number.isNaN(start)) return MeetingStatus.Scheduled;
  if (now > end) return MeetingStatus.Completed;
  if (item.botDispatchedAt) {
    const dispatched = Date.parse(item.botDispatchedAt);
    if (!Number.isNaN(dispatched) && now >= start - TRANSCRIPT_BOT_LEAD_MS) {
      return now >= start ? MeetingStatus.Active : MeetingStatus.Joining;
    }
  }
  if (now >= start) return MeetingStatus.Active;
  return MeetingStatus.Scheduled;
}

export function platformLabel(platform: string): MeetingPlatform {
  if (platform === "google_meet") return MeetingPlatform.GoogleMeet;
  if (platform === "zoom") return MeetingPlatform.Zoom;
  if (platform === "teams") return MeetingPlatform.Teams;
  return MeetingPlatform.Jitsi;
}

export function toAssistantMeeting(
  item: MeetingItem,
  { meetingFallback, locale }: { meetingFallback: string; locale: string },
  now = Date.now(),
): Meeting {
  const parsed = parseMeetingUrl(item.meetLink ?? "");
  const participants = [item.organizationName, item.mentorName].filter(
    (name): name is string => Boolean(name?.trim()),
  );
  return {
    id: item.id,
    title:
      item.agenda?.trim() || item.organizationName?.trim() || meetingFallback,
    platform: platformLabel(parsed?.platform ?? "google_meet"),
    platformKey: parsed?.platform ?? "",
    nativeMeetingId: parsed?.nativeMeetingId ?? "",
    status: assistantStatusFor(item, now),
    when: formatSlotDateTime(item.scheduledAt, locale),
    participants,
  };
}

export function withAssistantOverlay(
  meeting: Meeting,
  overlay?: Partial<
    Pick<
      Meeting,
      "status" | "nativeMeetingId" | "platformKey" | "platform" | "title"
    >
  >,
): Meeting {
  if (!overlay) return meeting;
  const merged = { ...meeting, ...overlay };
  if (meeting.status === MeetingStatus.Completed) {
    return { ...merged, status: MeetingStatus.Completed };
  }
  return merged;
}

export function matchCalendarMeetingId(
  meetings: MeetingItem[],
  meetingUrl: string,
): string | undefined {
  return meetings.find((item) => sameMeetingUrl(item.meetLink, meetingUrl))?.id;
}

/**
 * The link the add-bot box shows: what the user typed (even an empty box), or, while they have not touched it, the
 * selected or due meeting's link.
 */
export function assistantLinkBoxValue(
  typed: string | null,
  prefill: string,
): string {
  return typed ?? prefill;
}

/**
 * True for a complete Meet link that is none of the user's Menton calendar meetings: the backend sends the assistant
 * only into those, so the user is told before the send fails.
 */
export function isForeignMeetingLink(
  meetings: MeetingItem[],
  typed: string | null,
): boolean {
  if (!typed || !parseMeetingUrl(typed)) return false;
  return matchCalendarMeetingId(meetings, typed) === undefined;
}
