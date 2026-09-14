import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import { isMeetingEnded } from "@/lib/mentorship-workspace";

export enum StartupMeetingView {
  Topic = "topic",
  Time = "time",
  Notes = "notes",
}

export const STARTUP_MEETING_VIEW_LABELS: Record<StartupMeetingView, string> = {
  [StartupMeetingView.Topic]: "Konu",
  [StartupMeetingView.Time]: "Zaman",
  [StartupMeetingView.Notes]: "Toplantı Notları",
};

export enum MeetingTiming {
  Upcoming = "upcoming",
  Held = "held",
}

export const MEETING_TIMING_LABELS: Record<MeetingTiming, string> = {
  [MeetingTiming.Upcoming]: "Yaklaşan",
  [MeetingTiming.Held]: "Gerçekleşti",
};

const UNTITLED_MEETING = "Toplantı";

export function meetingTitle(meeting: MeetingItem) {
  return meeting.agenda?.trim() || UNTITLED_MEETING;
}

export function meetingTiming(meeting: MeetingItem, now = new Date()) {
  return isMeetingEnded(meeting, now)
    ? MeetingTiming.Held
    : MeetingTiming.Upcoming;
}

/** Cancelled meetings never happened, so no view lists them. */
export function visibleMeetings(meetings: MeetingItem[]) {
  return meetings.filter(
    (meeting) =>
      String(meeting.status).toUpperCase() !== MeetingStatus.Cancelled,
  );
}

function newestFirst(left: MeetingItem, right: MeetingItem) {
  return right.scheduledAt.localeCompare(left.scheduledAt);
}

export type MeetingTopic = {
  key: string;
  title: string;
  /** Newest first. */
  meetings: MeetingItem[];
  latest: MeetingItem;
  /** The soonest meeting still ahead, if any. */
  upcoming: MeetingItem | null;
};

// A topic is one mentorship's run of meetings; meetings outside any
// mentorship are grouped by their agenda instead.
export function groupMeetingsByTopic(
  meetings: MeetingItem[],
  now = new Date(),
): MeetingTopic[] {
  const groups = new Map<string, MeetingItem[]>();
  for (const meeting of meetings) {
    const key =
      meeting.mentorshipRequestId ??
      `agenda:${meetingTitle(meeting).toLocaleLowerCase("tr-TR")}`;
    groups.set(key, [...(groups.get(key) ?? []), meeting]);
  }

  const topics = [...groups.entries()].map(([key, items]) => {
    const sorted = [...items].sort(newestFirst);
    const ahead = sorted.filter(
      (meeting) => meetingTiming(meeting, now) === MeetingTiming.Upcoming,
    );
    const upcoming = ahead.at(-1) ?? null;
    return {
      key,
      title: meetingTitle(upcoming ?? sorted[0]),
      meetings: sorted,
      latest: sorted[0],
      upcoming,
    };
  });

  // Topics with a meeting ahead come first, soonest first; then the rest,
  // most recently met first.
  return topics.sort((left, right) => {
    if (left.upcoming && right.upcoming) {
      return left.upcoming.scheduledAt.localeCompare(
        right.upcoming.scheduledAt,
      );
    }
    if (left.upcoming) return -1;
    if (right.upcoming) return 1;
    return newestFirst(left.latest, right.latest);
  });
}

export type MeetingMonth = {
  key: string;
  label: string;
  /** Soonest first within the month. */
  meetings: MeetingItem[];
};

export type MeetingYear = {
  year: number;
  /** Newest month first. */
  months: MeetingMonth[];
};

const monthName = new Intl.DateTimeFormat("tr-TR", { month: "long" });

export function groupMeetingsByYear(meetings: MeetingItem[]): MeetingYear[] {
  const months = new Map<string, MeetingItem[]>();
  for (const meeting of meetings) {
    const date = new Date(meeting.scheduledAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months.set(key, [...(months.get(key) ?? []), meeting]);
  }

  const years = new Map<number, MeetingMonth[]>();
  for (const key of [...months.keys()].sort().reverse()) {
    const items = [...(months.get(key) ?? [])].sort((left, right) =>
      left.scheduledAt.localeCompare(right.scheduledAt),
    );
    const year = Number(key.slice(0, 4));
    const label = monthName.format(new Date(items[0].scheduledAt));
    years.set(year, [
      ...(years.get(year) ?? []),
      {
        key,
        label: label.charAt(0).toLocaleUpperCase("tr-TR") + label.slice(1),
        meetings: items,
      },
    ]);
  }

  return [...years.entries()].map(([year, yearMonths]) => ({
    year,
    months: yearMonths,
  }));
}

/** The shared note-taking room for a meeting. */
export function meetingNotebookHref(meetingId: string) {
  return `/notes/${encodeURIComponent(meetingId)}`;
}

// Paragraphs and headings carry no space between them in the markup, so one
// goes in after each before the tags come off.
const BLOCK_BOUNDARY = /<\/(?:p|h[1-6]|li|blockquote|pre|div)>|<br\s*\/?>/gi;

/** A meeting note's text without its markup, for a short preview. */
export function notePreview(content: string) {
  if (!content.trim()) return "";
  const spaced = content.replace(BLOCK_BOUNDARY, (tag) => `${tag} `);
  const text =
    typeof DOMParser === "undefined"
      ? spaced.replace(/<[^>]+>/g, " ")
      : (new DOMParser().parseFromString(spaced, "text/html").body
          .textContent ?? "");
  return text.replace(/\s+/g, " ").trim();
}
