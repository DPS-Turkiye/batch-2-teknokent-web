"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { useActionItemsForRequests } from "@/hooks/use-action-items";
import { useMeetings } from "@/hooks/use-meetings";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { STARTUP_PROCESS_QUERY_KEY } from "@/hooks/use-startup-process";
import type { MeetingItem } from "@/interfaces/meeting";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import {
  CalendarFilter,
  MENTEE_WEEK_HOURS,
  startOfWeek,
  weekDays,
} from "@/lib/calendar";
import { ClientApiError } from "@/lib/client/api";
import { getStartupProcess } from "@/lib/client/startup-process";
import {
  CalendarEntryKind,
  deliverableEntries,
  entriesOnDay,
  filterEntries,
  isOpenDeliverable,
  meetingEntries,
  MENTEE_WEEK_DAY_COUNT,
  upcomingEntries,
  weekSummary,
} from "@/lib/mentee-calendar";

const UPCOMING_LIMIT = 3;
const PREP_LIMIT = 3;
const NOW_REFRESH_MS = 60_000;

/**
 * The mentee's week: mentorship meetings, and deliverables from mentorship
 * action items and Süreç assignments. It only reads — meetings are requested
 * from the mentor-request flow, not from here.
 */
export function useMenteeCalendar(importedMeetings: MeetingItem[] = []) {
  const texts = { t: useTranslations("calendar"), locale: useLocale() };
  const meetingsQuery = useMeetings();
  const requestsQuery = useMentorshipRequests(UserRole.Mentee);
  // A mentee outside a startup has no process; the calendar just shows no Süreç deliverables.
  const processQuery = useQuery({
    queryKey: STARTUP_PROCESS_QUERY_KEY,
    queryFn: getStartupProcess,
    retry: false,
  });
  const [filter, setFilter] = useState(CalendarFilter.All);
  const [cursor, setCursor] = useState(() => new Date());
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), NOW_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  const requestIds = useMemo(
    () =>
      (requestsQuery.data ?? [])
        .filter(
          (request) => request.status === MentorshipRequestStatus.Accepted,
        )
        .map((request) => request.id),
    [requestsQuery.data],
  );
  const actionItems = useActionItemsForRequests(requestIds);

  const weekStart = useMemo(() => startOfWeek(cursor), [cursor]);
  const days = useMemo(
    () => weekDays(weekStart, MENTEE_WEEK_DAY_COUNT),
    [weekStart],
  );

  const meetings = useMemo(() => {
    const byId = new Map<string, MeetingItem>();
    for (const meeting of [
      ...importedMeetings,
      ...(meetingsQuery.data ?? []),
    ]) {
      byId.set(meeting.id, meeting);
    }
    return [...byId.values()];
  }, [importedMeetings, meetingsQuery.data]);

  const entries = [
    ...meetingEntries(meetings, texts),
    ...deliverableEntries(
      [
        ...actionItems.byRequest.flat(),
        ...(processQuery.data?.assignments ?? []),
      ],
      texts,
    ),
  ];
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + MENTEE_WEEK_DAY_COUNT);
  const weekEntries = entries.filter(
    (entry) => entry.startsAt >= weekStart && entry.startsAt < weekEnd,
  );
  const visible = filterEntries(weekEntries, filter);

  const nextMeeting =
    upcomingEntries(
      entries.filter((entry) => entry.kind === CalendarEntryKind.Mentorship),
      now,
      1,
    )[0]?.meeting ?? null;
  const requestIndex = nextMeeting?.mentorshipRequestId
    ? requestIds.indexOf(nextMeeting.mentorshipRequestId)
    : -1;
  const prepItems = (actionItems.byRequest[requestIndex] ?? [])
    .filter(isOpenDeliverable)
    .sort((left, right) =>
      (left.dueDate ?? "9999").localeCompare(right.dueDate ?? "9999"),
    )
    .slice(0, PREP_LIMIT);

  function moveWeek(weeks: number) {
    setCursor((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + weeks * 7);
      return next;
    });
  }

  const firstDay = days[0];
  const lastDay = days[days.length - 1];
  // No startup means no process (the proxy answers 401); anything else is a real failure.
  const processFailed =
    processQuery.isError &&
    !(
      processQuery.error instanceof ClientApiError &&
      processQuery.error.status === 401
    );

  return {
    filter,
    setFilter,
    days,
    hours: MENTEE_WEEK_HOURS,
    now,
    rangeLabel: new Intl.DateTimeFormat(texts.locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).formatRange(firstDay ?? lastDay ?? new Date(), lastDay ?? new Date()),
    previous: () => moveWeek(-1),
    next: () => moveWeek(1),
    today: () => {
      const current = new Date();
      setCursor(current);
      setNow(current);
    },
    entriesByDay: days.map((day) => entriesOnDay(visible, day)),
    summary: weekSummary(weekEntries, texts),
    upcoming: upcomingEntries(entries, now, UPCOMING_LIMIT),
    prep: nextMeeting ? { meeting: nextMeeting, items: prepItems } : null,
    isLoading: meetingsQuery.isLoading,
    sidebarLoading:
      requestsQuery.isLoading ||
      actionItems.isLoading ||
      processQuery.isLoading,
    sidebarError: actionItems.isError || processFailed,
    loadError: meetingsQuery.error,
  };
}
