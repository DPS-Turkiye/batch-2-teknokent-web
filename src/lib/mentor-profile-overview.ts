import type { useTranslations } from "next-intl";

import type { useOptionLabel } from "@/hooks/use-option-label";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  WEEKDAY_ORDER,
  type MentorAvailabilityRule,
  type MentorAvailabilitySettings,
  type MentorLanguage,
  type MentorProfile,
  type MentorProgram,
  type Weekday,
} from "@/interfaces/mentor";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import { toTimeInput } from "@/lib/mentor-availability";

/** The profile page's translators and language, for the labels built here. */
export type MentorProfileTexts = {
  t: ReturnType<typeof useTranslations<"mentorProfile">>;
  tOptions: ReturnType<typeof useTranslations<"options">>;
  optionLabel: ReturnType<typeof useOptionLabel>;
  locale: string;
};

export type LabelValue = { label: string; value: string; muted?: boolean };

export type MentorshipHistoryRow = {
  id: string;
  title: string;
  detail: string;
  /** "4,5": the mentees' average for this mentorship, or null before any feedback. */
  rating: string | null;
};

/** "4,8" for a 1–5 average; null before the first feedback. */
export function ratingLabel(
  average: number | null | undefined,
  locale: string,
) {
  return average == null
    ? null
    : new Intl.NumberFormat(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(average);
}

/** "Design / UX Mentor · Döngü Labs · 12 yıl" */
export function profileSubtitle(profile: MentorProfile) {
  return [profile.professionalTitle, profile.company, profile.experienceLevel]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" · ");
}

function completedMeetings(meetings: MeetingItem[]) {
  return meetings.filter(
    (meeting) => meeting.status === MeetingStatus.Completed,
  );
}

export function completedSessionCount(meetings: MeetingItem[]) {
  return completedMeetings(meetings).length;
}

/** "8 ay", "2 yıl", counted from the first accepted mentorship; null without one. */
export function mentorshipDurationLabel(
  accepted: MentorshipRequest[],
  { t }: Pick<MentorProfileTexts, "t">,
  now = new Date(),
) {
  if (accepted.length === 0) return null;
  const start = new Date(
    Math.min(...accepted.map((request) => Date.parse(request.createdAt))),
  );
  let months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    now.getMonth() -
    start.getMonth();
  // A month only counts once its day has come round again: Aug 31 → Sep 1 is a day, not a month.
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 1) return t("stats.lessThanMonth");
  if (months < 12) return t("stats.months", { count: months });
  return t("stats.years", { count: Math.floor(months / 12) });
}

/** "Mar – Haz 2026", "Kas 2025 – Şub 2026", or "Mar 2026" within one month. */
function periodLabel(start: Date, end: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
  }).formatRange(start, end);
}

/** Accepted mentorships, each with its period and completed sessions. */
export function mentorshipHistory(
  accepted: MentorshipRequest[],
  meetings: MeetingItem[],
  { t, locale }: Pick<MentorProfileTexts, "t" | "locale">,
  ratingByRequest: Record<string, number> = {},
): MentorshipHistoryRow[] {
  const completed = completedMeetings(meetings);
  return accepted.map((request) => {
    const sessions = completed.filter(
      (meeting) => meeting.mentorshipRequestId === request.id,
    );
    const start = Date.parse(request.createdAt);
    const end = sessions.reduce(
      (latest, meeting) => Math.max(latest, Date.parse(meeting.scheduledAt)),
      start,
    );
    return {
      id: request.id,
      title:
        [request.organizationName, request.requesterName]
          .filter(Boolean)
          .join(" · ") || request.supportArea,
      detail: `${periodLabel(new Date(start), new Date(end), locale)} · ${t("history.sessions", { count: sessions.length })}`,
      rating: ratingLabel(ratingByRequest[request.id], locale),
    };
  });
}

/** One bullet per line of the mentor's working style, then sector and stages. */
export function workingStyleBullets(
  profile: MentorProfile,
  { t }: Pick<MentorProfileTexts, "t">,
) {
  const bullets = profile.mentoringStyle
    .split(/\n|•/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (profile.sectorExperience.trim()) {
    bullets.push(
      t("style.sectorBullet", { value: profile.sectorExperience.trim() }),
    );
  }
  if (profile.startupStages.trim()) {
    bullets.push(
      t("style.stagesBullet", { value: profile.startupStages.trim() }),
    );
  }
  return bullets;
}

/** Varsayılan süre, Format, Görüşme sıklığı, Ön hazırlık dosyası; unset ones are left out. */
export function meetingPreferenceRows(
  profile: MentorProfile,
  settings: MentorAvailabilitySettings | undefined,
  { t, tOptions, optionLabel }: MentorProfileTexts,
): LabelValue[] {
  const rows: LabelValue[] = [
    {
      label: t("prefs.duration"),
      value: settings
        ? t("prefs.minutes", { count: settings.defaultMeetingDurationMinutes })
        : "",
    },
    {
      label: t("prefs.format"),
      value: profile.meetingMode
        ? optionLabel("meetingFormat", profile.meetingMode)
        : "",
    },
    {
      label: t("prefs.frequency"),
      value: profile.meetingFrequency
        ? tOptions(`meetingFrequency.${profile.meetingFrequency}`)
        : "",
    },
    {
      label: t("prefs.prepFile"),
      value: profile.prepFileRequirement
        ? tOptions(`prepFile.${profile.prepFileRequirement}`)
        : "",
    },
  ];
  return rows.filter((row) => Boolean(row.value.trim()));
}

/** "Türkçe · İngilizce", or "" when the mentor has not chosen any. */
export function languagesLabel(
  languages: MentorLanguage[] | undefined,
  { tOptions }: Pick<MentorProfileTexts, "tOptions">,
) {
  return (languages ?? [])
    .map((language) => tOptions(`language.${language}`))
    .join(" · ");
}

/** "Aktif · Design mentor", or just the status when the mentor has no role there. */
export function programDetail(
  program: MentorProgram,
  { t }: Pick<MentorProfileTexts, "t">,
) {
  return [t(`programs.status.${program.status}`), program.role?.trim()]
    .filter(Boolean)
    .join(" · ");
}

export type WeeklyAvailabilityTexts = {
  weekday: (day: Weekday) => string;
  otherDays: string;
  closed: string;
};

/** "Salı 09:00–10:00, 14:00–17:00" per open day, then "Diğer günler Kapalı". */
export function weeklyAvailabilityRows(
  rules: MentorAvailabilityRule[],
  { weekday, otherDays, closed }: WeeklyAvailabilityTexts,
): LabelValue[] {
  const rows: LabelValue[] = WEEKDAY_ORDER.flatMap((day) => {
    const ranges = rules
      .filter((rule) => rule.dayOfWeek === day)
      .sort((left, right) => left.startTime.localeCompare(right.startTime))
      .map(
        (rule) => `${toTimeInput(rule.startTime)}–${toTimeInput(rule.endTime)}`,
      );
    return ranges.length > 0
      ? [{ label: weekday(day), value: ranges.join(", ") }]
      : [];
  });
  if (rows.length > 0 && rows.length < WEEKDAY_ORDER.length) {
    rows.push({ label: otherDays, value: closed, muted: true });
  }
  return rows;
}
