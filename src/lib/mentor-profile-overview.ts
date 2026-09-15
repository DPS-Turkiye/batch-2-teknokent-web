import { type MeetingItem, MeetingStatus } from "@/interfaces/meeting";
import {
  type MentorAvailabilityRule,
  type MentorAvailabilitySettings,
  type MentorProfile,
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
} from "@/interfaces/mentor";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import { toTimeInput } from "@/lib/mentor-availability";

export type LabelValue = { label: string; value: string };

export type MentorshipHistoryRow = {
  id: string;
  title: string;
  detail: string;
};

/** "Design / UX Mentor · Döngü Labs · 12 yıl" */
export function profileSubtitle(profile: MentorProfile) {
  return [profile.professionalTitle, profile.company, profile.experienceLevel]
    .map((part) => part?.trim())
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
  now = new Date(),
) {
  if (accepted.length === 0) return null;
  const start = new Date(
    Math.min(...accepted.map((request) => Date.parse(request.createdAt))),
  );
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    now.getMonth() -
    start.getMonth();
  if (months < 1) return "1 aydan az";
  if (months < 12) return `${months} ay`;
  return `${Math.floor(months / 12)} yıl`;
}

const MONTH = new Intl.DateTimeFormat("tr-TR", { month: "short" });
const MONTH_YEAR = new Intl.DateTimeFormat("tr-TR", {
  month: "short",
  year: "numeric",
});

/** "Mar – Haz 2026", "Kas 2025 – Şub 2026", or "Mar 2026" within one month. */
function periodLabel(start: Date, end: Date) {
  const sameYear = start.getFullYear() === end.getFullYear();
  if (sameYear && start.getMonth() === end.getMonth()) {
    return MONTH_YEAR.format(start);
  }
  return `${(sameYear ? MONTH : MONTH_YEAR).format(start)} – ${MONTH_YEAR.format(end)}`;
}

/** Accepted mentorships, each with its period and completed sessions. */
export function mentorshipHistory(
  accepted: MentorshipRequest[],
  meetings: MeetingItem[],
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
      detail: `${periodLabel(new Date(start), new Date(end))} · ${sessions.length} seans`,
    };
  });
}

/** One bullet per line of the mentor's working style, then sector and stages. */
export function workingStyleBullets(profile: MentorProfile) {
  const bullets = (profile.mentoringStyle ?? "")
    .split(/\n|•/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (profile.sectorExperience?.trim()) {
    bullets.push(`Sektör deneyimi: ${profile.sectorExperience.trim()}`);
  }
  if (profile.startupStages?.trim()) {
    bullets.push(`Çalıştığı aşamalar: ${profile.startupStages.trim()}`);
  }
  return bullets;
}

export function meetingPreferenceRows(
  profile: MentorProfile,
  settings: MentorAvailabilitySettings | undefined,
): LabelValue[] {
  const rows: LabelValue[] = settings
    ? [
        {
          label: "Varsayılan süre",
          value: `${settings.defaultMeetingDurationMinutes} dk`,
        },
        {
          label: "Görüşmeler arası",
          value: `${settings.meetingBufferMinutes} dk`,
        },
      ]
    : [];
  rows.push(
    { label: "Format", value: profile.meetingMode },
    { label: "Yanıt süresi", value: profile.responseTimeLabel },
    { label: "İletişim", value: profile.communicationPreference },
  );
  return rows.filter((row) => Boolean(row.value?.trim()));
}

/** "Salı 09:00–10:00, 14:00–17:00" per open day, then "Diğer günler Kapalı". */
export function weeklyAvailabilityRows(
  rules: MentorAvailabilityRule[],
): LabelValue[] {
  const rows = WEEKDAY_ORDER.flatMap((day) => {
    const ranges = rules
      .filter((rule) => rule.dayOfWeek === day)
      .sort((left, right) => left.startTime.localeCompare(right.startTime))
      .map(
        (rule) => `${toTimeInput(rule.startTime)}–${toTimeInput(rule.endTime)}`,
      );
    return ranges.length > 0
      ? [{ label: WEEKDAY_LABELS[day], value: ranges.join(", ") }]
      : [];
  });
  if (rows.length > 0 && rows.length < WEEKDAY_ORDER.length) {
    rows.push({ label: "Diğer günler", value: "Kapalı" });
  }
  return rows;
}
