"use client";

import { useMemo, useState } from "react";

import { useMeetings } from "@/hooks/use-meetings";
import type { MeetingItem } from "@/interfaces/meeting";
import {
  CalendarFilter,
  MENTEE_CALENDAR_HOURS,
  monthLabel,
  startOfWeek,
  weekDays,
  weekRangeLabel,
} from "@/lib/calendar";

export type CalendarViewMode = "WEEK" | "MONTH";

/**
 * The mentee's own calendar: read-only. There is no meeting-creation flow
 * here today — a mentee books against a mentor's offered slots from the
 * mentor-request flow, not from this page — so unlike use-mentor-calendar
 * this hook has no addMeeting/rules; it only navigates and filters.
 */
export function useMenteeCalendar(importedMeetings: MeetingItem[] = []) {
  const meetingsQuery = useMeetings();
  const [viewMode, setViewMode] = useState<CalendarViewMode>("WEEK");
  const [filter, setFilter] = useState<CalendarFilter>(CalendarFilter.All);
  const [cursor, setCursor] = useState(() => new Date());

  const weekStart = useMemo(() => startOfWeek(cursor), [cursor]);
  const days = useMemo(() => weekDays(weekStart, 7), [weekStart]);
  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 7);
    return end;
  }, [weekStart]);

  const rangeLabel =
    viewMode === "WEEK"
      ? weekRangeLabel(weekStart, days[days.length - 1])
      : monthLabel(cursor);

  function previous() {
    setCursor((current) => {
      const next = new Date(current);
      if (viewMode === "WEEK") next.setDate(next.getDate() - 7);
      else next.setMonth(next.getMonth() - 1);
      return next;
    });
  }

  function next() {
    setCursor((current) => {
      const value = new Date(current);
      if (viewMode === "WEEK") value.setDate(value.getDate() + 7);
      else value.setMonth(value.getMonth() + 1);
      return value;
    });
  }

  function today() {
    setCursor(new Date());
  }

  const allMeetings = useMemo(() => {
    const byId = new Map<string, MeetingItem>();
    for (const meeting of [
      ...importedMeetings,
      ...(meetingsQuery.data ?? []),
    ]) {
      byId.set(meeting.id, meeting);
    }
    return [...byId.values()];
  }, [importedMeetings, meetingsQuery.data]);

  // No program events exist in the data model yet, mirroring the mentor
  // calendar's Program tab: an honest empty state, not a guess at content.
  const meetings = useMemo(() => {
    if (filter === CalendarFilter.Program) return [];
    if (viewMode !== "WEEK") return allMeetings;
    return allMeetings.filter((meeting) => {
      const at = new Date(meeting.scheduledAt);
      return at >= weekStart && at < weekEnd;
    });
  }, [allMeetings, filter, viewMode, weekStart, weekEnd]);

  return {
    viewMode,
    setViewMode,
    filter,
    setFilter,
    weekStart,
    days,
    hours: MENTEE_CALENDAR_HOURS,
    monthDate: cursor,
    rangeLabel,
    previous,
    next,
    today,
    meetings,
    isLoading: meetingsQuery.isLoading,
    loadError: meetingsQuery.error,
  };
}
