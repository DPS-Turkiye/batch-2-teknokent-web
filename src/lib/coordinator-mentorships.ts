import {
  type CoordinatorMentorship,
  type CoordinatorMentorshipDetail,
  CoordinatorMentorshipHealth,
  MentorshipStatus,
} from "@/interfaces/coordinator-mentorship";
import { formatDayMonth, formatLongDate } from "@/lib/utils";

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

export const HEALTH_LABELS: Record<CoordinatorMentorshipHealth, string> = {
  [CoordinatorMentorshipHealth.Risky]: "Riskli",
  [CoordinatorMentorshipHealth.FollowUp]: "Takip gerekli",
  [CoordinatorMentorshipHealth.Healthy]: "Sağlıklı",
  [CoordinatorMentorshipHealth.New]: "Yeni",
};

export const HEALTH_TONES: Record<
  CoordinatorMentorshipHealth,
  "red" | "amber" | "green" | "neutral"
> = {
  [CoordinatorMentorshipHealth.Risky]: "red",
  [CoordinatorMentorshipHealth.FollowUp]: "amber",
  [CoordinatorMentorshipHealth.Healthy]: "green",
  [CoordinatorMentorshipHealth.New]: "neutral",
};

export const SORT_LABELS: Record<MentorshipSort, string> = {
  [MentorshipSort.Risk]: "Risk",
  [MentorshipSort.LastMeeting]: "Son görüşme",
  [MentorshipSort.Name]: "Mentor adı",
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
export function healthFilterOptions(rows: CoordinatorMentorship[]) {
  const count = (health: CoordinatorMentorshipHealth) =>
    rows.filter((row) => row.health === health).length;
  return [
    { id: MentorshipHealthFilter.All, label: `Tümü ${rows.length}` },
    {
      id: MentorshipHealthFilter.Risky,
      label: `Müdahale gerekli ${count(CoordinatorMentorshipHealth.Risky)}`,
    },
    {
      id: MentorshipHealthFilter.FollowUp,
      label: `Takip gerekli ${count(CoordinatorMentorshipHealth.FollowUp)}`,
    },
    {
      id: MentorshipHealthFilter.Healthy,
      label: `Sağlıklı ${count(CoordinatorMentorshipHealth.Healthy)}`,
    },
  ];
}

export function topicOptions(rows: CoordinatorMentorship[]) {
  const topics = new Set(
    rows.map((row) => row.topic).filter((topic): topic is string => !!topic),
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

const TIME = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
});

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

/** A mentorship off its cadence shows "18 gün önce"; one on track shows the date. */
export function lastMeetingLabel(row: CoordinatorMentorship) {
  if (!row.lastMeetingAt || row.daysSinceLastMeeting == null) return "—";
  if (
    row.health === CoordinatorMentorshipHealth.Risky ||
    row.health === CoordinatorMentorshipHealth.FollowUp
  ) {
    return `${row.daysSinceLastMeeting} gün önce`;
  }
  return formatDayMonth(new Date(row.lastMeetingAt));
}

/** "Yarın · 14:00", "24 Eyl · 11:00", or why nothing is booked. */
export function nextMeetingLabel(row: CoordinatorMentorship, now = new Date()) {
  if (!row.nextMeetingAt) {
    return row.status === MentorshipStatus.Planned
      ? "Eşleşme onayı bekleniyor"
      : "Planlanmadı";
  }
  const at = new Date(row.nextMeetingAt);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const day = sameDay(at, now)
    ? "Bugün"
    : sameDay(at, tomorrow)
      ? "Yarın"
      : formatDayMonth(at);
  return `${day} · ${TIME.format(at)}`;
}

/** "2 açık · 1 gecikmiş", "Not eksik" or "—". */
export function actionsLabel(row: CoordinatorMentorship) {
  if (row.openActions === 0) {
    return row.missingNotes > 0 ? "Not eksik" : "—";
  }
  return row.overdueActions > 0
    ? `${row.openActions} açık · ${row.overdueActions} gecikmiş`
    : `${row.openActions} açık`;
}

export function needsIntervention(row: CoordinatorMentorship) {
  return row.health === CoordinatorMentorshipHealth.Risky;
}

/** The drawer's warning, or null when the mentorship is on track. */
export function cadenceAlert(detail: CoordinatorMentorshipDetail) {
  const row = detail.mentorship;
  if (
    row.health !== CoordinatorMentorshipHealth.Risky &&
    row.health !== CoordinatorMentorshipHealth.FollowUp
  ) {
    return null;
  }
  const silence =
    row.daysSinceLastMeeting == null
      ? "Henüz görüşme yapılmadı"
      : `${row.daysSinceLastMeeting} gündür görüşme yok`;
  const next = row.nextMeetingAt
    ? `sıradaki ${nextMeetingLabel(row)}`
    : "sıradaki planlanmadı";
  const facts = [`Eşik ${detail.staleAfterDays} gün.`];
  if (row.lastMeetingAt) {
    facts.push(`Son görüşme ${formatLongDate(row.lastMeetingAt)}.`);
  }
  if (row.overdueActions > 0) {
    facts.push(`${row.overdueActions} aksiyonun süresi geçti.`);
  }
  return { title: `${silence} · ${next}`, body: facts.join(" ") };
}

export function goalPercent(detail: CoordinatorMentorshipDetail) {
  return detail.goalsTotal === 0
    ? 0
    : Math.round((detail.goalsDone / detail.goalsTotal) * 100);
}

/** "4 görüşmenin 3'ü için not girildi · son 4 Eylül". */
export function notesSummary(detail: CoordinatorMentorshipDetail) {
  if (detail.pastMeetings === 0) return "Henüz tamamlanan görüşme yok.";
  const base = `${detail.pastMeetings} görüşmenin ${detail.notedMeetings}'i için not girildi`;
  return detail.lastNoteAt
    ? `${base} · son ${formatLongDate(detail.lastNoteAt)}`
    : base;
}

/** "Satış & GTM · 2/3 yük" for the mentor party card. */
export function mentorLoadLabel(detail: CoordinatorMentorshipDetail) {
  const load =
    detail.mentorCapacity != null
      ? `${detail.mentorLoad}/${detail.mentorCapacity} yük`
      : `${detail.mentorLoad} takım`;
  return detail.mentorship.mentorTitle
    ? `${detail.mentorship.mentorTitle} · ${load}`
    : load;
}

export function coordinatorMessageHref(programId: string, mentorId: string) {
  return `/coordinator/messages?program=${encodeURIComponent(programId)}&mentor=${encodeURIComponent(mentorId)}`;
}
