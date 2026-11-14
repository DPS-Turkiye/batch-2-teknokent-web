"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { peerReportWeekQueryKey } from "@/hooks/peer-report-queries";
import { useMinuteClock } from "@/hooks/use-minute-clock";
import { getPeerReportWeek } from "@/lib/client/peer-reports";
import {
  parseReportSearch,
  reportDayCards,
  reportWeekLabel,
} from "@/lib/peer-daily-report";
import { reportDayOf, shiftReportWeek } from "@/lib/peer-reports";
import { PeerReportView } from "@/types/peer-reports";

/**
 * "Faaliyet Raporum": Günlük or Haftalık, the week shown and the day chosen. They live in the URL (`view`, `week`,
 * `day`), so links from the meeting report and the weekly summary land on the right day and a reload keeps it.
 */
export function useReportWeek() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const now = useMinuteClock();
  const today = reportDayOf(now.toISOString());
  const search = parseReportSearch(Object.fromEntries(params.entries()), today);
  const week = useQuery({
    queryKey: peerReportWeekQueryKey(search.week),
    queryFn: () => getPeerReportWeek(search.week),
  });

  function go(next: { view?: PeerReportView; week?: string; day?: string }) {
    const query = new URLSearchParams(params.toString());
    query.set("view", next.view ?? search.view);
    query.set("week", next.week ?? search.week);
    if (next.day === undefined && next.week !== undefined) {
      query.delete("day");
    } else {
      query.set("day", next.day ?? search.day);
    }
    router.replace(`${pathname}?${query.toString()}`, { scroll: false });
  }

  return {
    view: search.view,
    weekStart: search.week,
    day: search.day,
    today,
    weekLabel: reportWeekLabel(search.week, locale),
    week,
    cards: reportDayCards(
      search.week,
      week.data?.days ?? [],
      search.day,
      today,
    ),
    dailySent: week.data?.dailySent ?? 0,
    setView: (view: PeerReportView) => go({ view }),
    previousWeek: () => go({ week: shiftReportWeek(search.week, -1) }),
    nextWeek: () => go({ week: shiftReportWeek(search.week, 1) }),
    /** A day card opens that day's Günlük view, from either segment. */
    selectDay: (day: string) => go({ view: PeerReportView.Daily, day }),
  };
}
