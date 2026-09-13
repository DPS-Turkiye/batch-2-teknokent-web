"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { actionItemsQueryKey } from "@/hooks/use-action-items";
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
  weekRangeLabel,
} from "@/lib/calendar";
import { getActionItems } from "@/lib/client/action-items";
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

/**
 * The mentee's week: mentorship meetings, and deliverables from mentorship
 * action items and Süreç assignments. It only reads — meetings are requested
 * from the mentor-request flow, not from here.
 */
export function useMenteeCalendar(importedMeetings: MeetingItem[] = []) {
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

  const requestIds = useMemo(
    () =>
      (requestsQuery.data ?? [])
        .filter(
          (request) => request.status === MentorshipRequestStatus.Accepted,
        )
        .map((request) => request.id),
    [requestsQuery.data],
  );
  const actionItemsByRequest = useQueries({
    queries: requestIds.map((id) => ({
      queryKey: actionItemsQueryKey(id),
      queryFn: () => getActionItems(id),
    })),
    combine: (results) => results.map((result) => result.data ?? []),
  });

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
    ...meetingEntries(meetings),
    ...deliverableEntries([
      ...actionItemsByRequest.flat(),
      ...(processQuery.data?.assignments ?? []),
    ]),
  ];
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
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
  const prepItems = (actionItemsByRequest[requestIndex] ?? [])
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

  const lastDay = days[days.length - 1];

  return {
    filter,
    setFilter,
    days,
    hours: MENTEE_WEEK_HOURS,
    now,
    rangeLabel: `${weekRangeLabel(days[0], lastDay)} ${lastDay.getFullYear()}`,
    previous: () => moveWeek(-1),
    next: () => moveWeek(1),
    today: () => {
      const current = new Date();
      setCursor(current);
      setNow(current);
    },
    entriesByDay: days.map((day) => entriesOnDay(visible, day)),
    summary: weekSummary(weekEntries),
    upcoming: upcomingEntries(entries, now, UPCOMING_LIMIT),
    prep: nextMeeting ? { meeting: nextMeeting, items: prepItems } : null,
    isLoading: meetingsQuery.isLoading,
    loadError: meetingsQuery.error,
  };
}
