import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import { isMeetingEnded } from "@/lib/mentorship-workspace";

export enum StartupMeetingView {
  Topic = "topic",
  Time = "time",
  Notes = "notes",
  Mentor = "mentor",
}

export enum MeetingTiming {
  Upcoming = "upcoming",
  Held = "held",
}

const UNTITLED_MEETING = "Toplantı";

/** The agenda, or `untitled` (the page's "Toplantı") when there is none. */
export function meetingTitle(
  meeting: MeetingItem,
  untitled = UNTITLED_MEETING,
) {
  return meeting.agenda?.trim() || untitled;
}

export function meetingTiming(meeting: MeetingItem, now = new Date()) {
  return isMeetingEnded(meeting, now)
    ? MeetingTiming.Held
    : MeetingTiming.Upcoming;
}

/** Cancelled meetings never happened, so no view lists them. */
export function visibleMeetings(meetings: MeetingItem[]) {
  return meetings.filter(
    (meeting) => meeting.status !== MeetingStatus.Cancelled,
  );
}

function newestFirst(left: MeetingItem, right: MeetingItem) {
  return right.scheduledAt.localeCompare(left.scheduledAt);
}

/** Other meetings this startup had with the same mentor, newest first. */
export function meetingsWithSameMentor(
  meetings: MeetingItem[],
  meeting: MeetingItem,
) {
  if (!meeting.mentorId) return [];
  return meetings
    .filter(
      (item) => item.id !== meeting.id && item.mentorId === meeting.mentorId,
    )
    .sort(newestFirst);
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
  untitled = UNTITLED_MEETING,
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
    const latest = sorted[0];
    if (!latest) return null;
    const upcoming = ahead.at(-1) ?? null;
    return {
      key,
      title: meetingTitle(upcoming ?? latest, untitled),
      meetings: sorted,
      latest,
      upcoming,
    };
  });

  return sortMeetingStacks(topics.filter((topic) => topic != null));
}

/** One deck per mentor: every meeting this startup had with them. */
export function groupMeetingsByMentor(
  meetings: MeetingItem[],
  now = new Date(),
  unnamed = "Mentor",
): MeetingTopic[] {
  const groups = new Map<string, MeetingItem[]>();
  for (const meeting of meetings) {
    const key = meeting.mentorId ? `mentor:${meeting.mentorId}` : "mentor:none";
    groups.set(key, [...(groups.get(key) ?? []), meeting]);
  }

  const stacks = [...groups.entries()].map(([key, items]) => {
    const sorted = [...items].sort(newestFirst);
    const ahead = sorted.filter(
      (meeting) => meetingTiming(meeting, now) === MeetingTiming.Upcoming,
    );
    const latest = sorted[0];
    if (!latest) return null;
    const upcoming = ahead.at(-1) ?? null;
    return {
      key,
      title: (upcoming ?? latest).mentorName?.trim() || unnamed,
      meetings: sorted,
      latest,
      upcoming,
    };
  });

  return sortMeetingStacks(stacks.filter((stack) => stack != null));
}

function sortMeetingStacks(stacks: MeetingTopic[]) {
  return stacks.sort((left, right) => {
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

export function groupMeetingsByYear(
  meetings: MeetingItem[],
  locale = "tr",
): MeetingYear[] {
  const monthName = new Intl.DateTimeFormat(locale, { month: "long" });
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
    const first = items[0];
    if (!first) continue;
    const label = monthName.format(new Date(first.scheduledAt));
    years.set(year, [
      ...(years.get(year) ?? []),
      {
        key,
        label: label.charAt(0).toLocaleUpperCase(locale) + label.slice(1),
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
      : new DOMParser().parseFromString(spaced, "text/html").body.textContent;
  return text.replace(/\s+/g, " ").trim();
}

export function heldMeetingsNewestFirst(meetings: MeetingItem[]) {
  return visibleMeetings(meetings)
    .filter((meeting) => meetingTiming(meeting) === MeetingTiming.Held)
    .sort((left, right) => right.scheduledAt.localeCompare(left.scheduledAt));
}
