"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";

import { peerReportMeetingsQueryKey } from "@/hooks/peer-report-queries";
import { useMinuteClock } from "@/hooks/use-minute-clock";
import { peerWeeklyReportQueryKey } from "@/hooks/use-weekly-report";
import {
  getPeerReportMeetings,
  getPeerWeeklyReport,
} from "@/lib/client/peer-reports";
import {
  bannerWindow,
  latestUnreportedMeeting,
  reportWeekLabel,
  weekCardCounts,
} from "@/lib/peer-daily-report";
import {
  fromIsoDay,
  meetingReportHref,
  peerReportBadge,
  reportDayOf,
  reportWeekHref,
  reportWeekStart,
} from "@/lib/peer-reports";
import { formatReportDeadline } from "@/lib/peer-weekly-report";

/**
 * Menteelerim's report cards: the banner asking for the latest held meeting's report, and "Bu haftanın raporu" with the
 * week's status, how much was added on its own and when it is due.
 */
export function usePeerMenteesTab() {
  const locale = useLocale();
  const now = useMinuteClock();
  const today = reportDayOf(now.toISOString());
  const weekStart = reportWeekStart(fromIsoDay(today));
  const range = bannerWindow(today);
  const meetings = useQuery({
    queryKey: peerReportMeetingsQueryKey(range.from, range.to),
    queryFn: () => getPeerReportMeetings(range.from, range.to),
  });
  const weekly = useQuery({
    queryKey: peerWeeklyReportQueryKey(weekStart),
    queryFn: () => getPeerWeeklyReport(weekStart),
  });
  const due = latestUnreportedMeeting(meetings.data ?? []);
  const week = weekly.data;

  return {
    // A failed read must not look like "nothing due", so the tab says it could not load the cards.
    error: meetings.error ?? weekly.error,
    dueMeeting: due
      ? { menteeName: due.menteeName, href: meetingReportHref(due.meetingId) }
      : null,
    week: week
      ? {
          badge: peerReportBadge(week.status),
          label: reportWeekLabel(weekStart, locale),
          ...weekCardCounts(week),
          deadline: formatReportDeadline(week.deadline, locale),
          href: reportWeekHref(weekStart),
        }
      : null,
  };
}
