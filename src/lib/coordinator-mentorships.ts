import type { useTranslations } from "next-intl";

import {
  CoordinatorMentorshipHealth,
  MentorshipStatus,
  type CoordinatorMentorship,
  type CoordinatorMentorshipDetail,
} from "@/interfaces/coordinator-mentorship";
import { formatDayMonth, formatLongDate, relativeDayLabel } from "@/lib/utils";

export type MentorshipTexts = {
  t: ReturnType<typeof useTranslations<"coordinatorMentorships">>;
  locale: string;
};

export enum MentorshipHealthFilter {
  All = "ALL",
  Risky = "RISKY",
  FollowUp = "FOLLOW_UP",
  Healthy = "HEALTHY",
}

export enum MentorshipSort {
  Risk = "RISK",
  LastMeeting = "LAST_MEETING",
  Name = "NAME",
}

export enum MentorshipDrawerTab {
  Summary = "SUMMARY",
  Meetings = "MEETINGS",
  Progress = "PROGRESS",
}

export const MENTORSHIP_PAGE_SIZE = 20;
export const ALL_TOPICS = "Tümü";

export const HEALTH_TONES: Record<
  CoordinatorMentorshipHealth,
  "red" | "amber" | "green" | "neutral"
> = {
  [CoordinatorMentorshipHealth.Risky]: "red",
  [CoordinatorMentorshipHealth.FollowUp]: "amber",
  [CoordinatorMentorshipHealth.Healthy]: "green",
  [CoordinatorMentorshipHealth.New]: "neutral",
};

const HEALTH_OF_FILTER: Record<
  Exclude<MentorshipHealthFilter, MentorshipHealthFilter.All>,
  CoordinatorMentorshipHealth
> = {
  [MentorshipHealthFilter.Risky]: CoordinatorMentorshipHealth.Risky,
  [MentorshipHealthFilter.FollowUp]: CoordinatorMentorshipHealth.FollowUp,
  [MentorshipHealthFilter.Healthy]: CoordinatorMentorshipHealth.Healthy,
};

/** "Tümü 64 · Müdahale gerekli 6 · Takip gerekli 10 · Sağlıklı 48". */
export function healthFilterOptions(
  rows: CoordinatorMentorship[],
  t: MentorshipTexts["t"],
) {
  return Object.values(MentorshipHealthFilter).map((id) => ({
    id,
    label: t(`filters.${id}`, {
      count:
        id === MentorshipHealthFilter.All
          ? rows.length
          : rows.filter((row) => row.health === HEALTH_OF_FILTER[id]).length,
    }),
  }));
}

export function topicOptions(rows: CoordinatorMentorship[]) {
  const topics = new Set(
    rows
      .map((row) => row.topic)
      .filter((topic): topic is string => Boolean(topic)),
  );
  return [ALL_TOPICS, ...[...topics].sort((a, b) => a.localeCompare(b, "tr"))];
}

export function filterMentorships(
  rows: CoordinatorMentorship[],
  {
    health,
    search,
    topic,
  }: { health: MentorshipHealthFilter; search: string; topic: string },
) {
  const needle = search.trim().toLocaleLowerCase("tr");
  return rows.filter(
    (row) =>
      (health === MentorshipHealthFilter.All ||
        row.health === HEALTH_OF_FILTER[health]) &&
      (topic === ALL_TOPICS || row.topic === topic) &&
      (!needle ||
        row.mentorName.toLocaleLowerCase("tr").includes(needle) ||
        row.organizationName.toLocaleLowerCase("tr").includes(needle)),
  );
}

/** The backend already sends the risk order, so Risk keeps it. */
export function sortMentorships(
  rows: CoordinatorMentorship[],
  sort: MentorshipSort,
) {
  if (sort === MentorshipSort.Risk) return rows;
  const sorted = [...rows];
  if (sort === MentorshipSort.Name) {
    return sorted.sort((a, b) =>
      a.mentorName.localeCompare(b.mentorName, "tr"),
    );
  }
  return sorted.sort(
    (a, b) => (b.daysSinceLastMeeting ?? -1) - (a.daysSinceLastMeeting ?? -1),
  );
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

/** A mentorship off its cadence shows "18 gün önce"; one on track shows the date. */
export function lastMeetingLabel(
  row: CoordinatorMentorship,
  { t, locale }: MentorshipTexts,
) {
  if (!row.lastMeetingAt || row.daysSinceLastMeeting == null) return "—";
  if (
    row.health === CoordinatorMentorshipHealth.Risky ||
    row.health === CoordinatorMentorshipHealth.FollowUp
  ) {
    return t("daysAgo", { days: row.daysSinceLastMeeting });
  }
  return formatDayMonth(new Date(row.lastMeetingAt), locale);
}

/** "Yarın · 14:00", "24 Eyl · 11:00", or why nothing is booked. */
export function nextMeetingLabel(
  row: CoordinatorMentorship,
  { t, locale }: MentorshipTexts,
  now = new Date(),
) {
  if (!row.nextMeetingAt) {
    return row.status === MentorshipStatus.Planned
      ? t("awaitingMatch")
      : t("notScheduled");
  }
  const at = new Date(row.nextMeetingAt);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const day = sameDay(at, now)
    ? relativeDayLabel(0, locale)
    : sameDay(at, tomorrow)
      ? relativeDayLabel(1, locale)
      : formatDayMonth(at, locale);
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(at);
  return `${day} · ${time}`;
}

/** "2 açık · 1 gecikmiş", "Not eksik" or "—". */
export function actionsLabel(
  row: CoordinatorMentorship,
  t: MentorshipTexts["t"],
) {
  if (row.openActions === 0) {
    return row.missingNotes > 0 ? t("noteMissing") : "—";
  }
  return row.overdueActions > 0
    ? t("openOverdue", { open: row.openActions, overdue: row.overdueActions })
    : t("openCount", { open: row.openActions });
}

export function needsIntervention(row: CoordinatorMentorship) {
  return row.health === CoordinatorMentorshipHealth.Risky;
}

/** The drawer's warning, or null when the mentorship is on track. */
export function cadenceAlert(
  detail: CoordinatorMentorshipDetail,
  texts: MentorshipTexts,
) {
  const { t, locale } = texts;
  const row = detail.mentorship;
  if (
    row.health !== CoordinatorMentorshipHealth.Risky &&
    row.health !== CoordinatorMentorshipHealth.FollowUp
  ) {
    return null;
  }
  const silence =
    row.daysSinceLastMeeting == null
      ? t("noMeetingYet")
      : t("silentDays", { days: row.daysSinceLastMeeting });
  const next = row.nextMeetingAt
    ? t("nextIs", { when: nextMeetingLabel(row, texts) })
    : t("nextNone");
  const facts = [t("threshold", { days: detail.staleAfterDays })];
  if (row.lastMeetingAt) {
    facts.push(
      t("lastMeetingOn", { date: formatLongDate(row.lastMeetingAt, locale) }),
    );
  }
  if (row.overdueActions > 0) {
    facts.push(t("overdueActions", { count: row.overdueActions }));
  }
  return { title: `${silence} · ${next}`, body: facts.join(" ") };
}

export function goalPercent(detail: CoordinatorMentorshipDetail) {
  return detail.goalsTotal === 0
    ? 0
    : Math.round((detail.goalsDone / detail.goalsTotal) * 100);
}

/** "4 görüşmenin 3'ü için not girildi · son 4 Eylül". */
export function notesSummary(
  detail: CoordinatorMentorshipDetail,
  { t, locale }: MentorshipTexts,
) {
  if (detail.pastMeetings === 0) return t("noPastMeetings");
  const counts = { total: detail.pastMeetings, noted: detail.notedMeetings };
  return detail.lastNoteAt
    ? t("notesTakenLast", {
        ...counts,
        date: formatLongDate(detail.lastNoteAt, locale),
      })
    : t("notesTaken", counts);
}

/** "Satış & GTM · 2/3 yük" for the mentor party card. */
export function mentorLoadLabel(
  detail: CoordinatorMentorshipDetail,
  t: MentorshipTexts["t"],
) {
  const load =
    detail.mentorCapacity != null
      ? t("mentorLoad", {
          load: detail.mentorLoad,
          capacity: detail.mentorCapacity,
        })
      : t("mentorTeams", { count: detail.mentorLoad });
  return detail.mentorship.mentorTitle
    ? `${detail.mentorship.mentorTitle} · ${load}`
    : load;
}

export function coordinatorMessageHref(programId: string, mentorId: string) {
  return `/coordinator/messages?program=${encodeURIComponent(programId)}&mentor=${encodeURIComponent(mentorId)}`;
}

export function coordinatorTeamMessageHref(
  programId: string,
  organizationId: string,
) {
  return `/coordinator/messages?program=${encodeURIComponent(programId)}&team=${encodeURIComponent(organizationId)}`;
}
