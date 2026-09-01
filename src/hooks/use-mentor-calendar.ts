"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import type { MeetingItem } from "@/interfaces/meeting";
import {
  Weekday,
  WEEKDAY_ORDER,
  type MentorAvailabilityRule,
  type MentorAvailabilitySlot,
} from "@/interfaces/mentor";
import { getMeetings, postMeeting } from "@/lib/client/meetings";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import {
  createAvailabilityRule,
  deleteAvailabilityRule,
  getAvailabilityRules,
  getMentorAvailability,
} from "@/lib/client/mentor-profile";

export enum CalendarFilter {
  All = "all",
  Mentorship = "mentorship",
  Program = "program",
}

export const CALENDAR_FILTER_LABELS: Record<CalendarFilter, string> = {
  [CalendarFilter.All]: "Tümü",
  [CalendarFilter.Mentorship]: "Mentorluk",
  [CalendarFilter.Program]: "Program",
};

/** The grid runs 09:00–18:00, matching the design. */
export const CALENDAR_HOURS = Array.from({ length: 10 }, (_, i) => 9 + i);

export const AVAILABILITY_RULES_KEY = ["mentor-availability-rules"] as const;
export const AVAILABILITY_SLOTS_KEY = ["mentor-availability-slots"] as const;

function startOfWeek(date: Date) {
  const copy = new Date(date);
  // getDay() is Sunday-based; the grid starts on Monday.
  const offset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - offset);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function useMentorCalendar() {
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [filter, setFilter] = useState<CalendarFilter>(CalendarFilter.All);

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date());
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [weekOffset]);

  const days = useMemo(
    () =>
      Array.from({ length: 5 }, (_, index) => {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + index);
        return day;
      }),
    [weekStart],
  );

  const meetingsQuery = useQuery({
    queryKey: ["meetings"],
    queryFn: getMeetings,
  });
  const rulesQuery = useQuery({
    queryKey: AVAILABILITY_RULES_KEY,
    queryFn: getAvailabilityRules,
  });
  const slotsQuery = useQuery({
    queryKey: AVAILABILITY_SLOTS_KEY,
    queryFn: getMentorAvailability,
  });

  function invalidateAvailability() {
    void queryClient.invalidateQueries({ queryKey: AVAILABILITY_RULES_KEY });
    void queryClient.invalidateQueries({ queryKey: AVAILABILITY_SLOTS_KEY });
  }

  const requestsQuery = useMentorshipRequests(UserRole.Mentor);

  // Only an accepted mentorship can host a meeting; the proxy resolves the
  // organization from whichever one is picked.
  const mentorships = useMemo<MentorshipRequest[]>(
    () =>
      (requestsQuery.data ?? []).filter(
        (request) => request.status === MentorshipRequestStatus.Accepted,
      ),
    [requestsQuery.data],
  );

  const createMeeting = useMutation({
    mutationFn: postMeeting,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });

  const createRule = useMutation({
    mutationFn: createAvailabilityRule,
    onSuccess: invalidateAvailability,
  });
  const removeRule = useMutation({
    mutationFn: deleteAvailabilityRule,
    onSuccess: invalidateAvailability,
  });

  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 5);
    return end;
  }, [weekStart]);

  // No program events exist in the data model yet, so that tab is empty by
  // definition rather than by filtering.
  const meetings = useMemo<MeetingItem[]>(() => {
    if (filter === CalendarFilter.Program) return [];
    return (meetingsQuery.data ?? []).filter((meeting) => {
      const at = new Date(meeting.scheduledAt);
      return at >= weekStart && at < weekEnd;
    });
  }, [meetingsQuery.data, filter, weekStart, weekEnd]);

  const slots = useMemo<MentorAvailabilitySlot[]>(
    () =>
      (slotsQuery.data ?? []).filter((slot) => {
        const at = new Date(slot.startsAt);
        return !slot.booked && at >= weekStart && at < weekEnd;
      }),
    [slotsQuery.data, weekStart, weekEnd],
  );

  const rules = useMemo<MentorAvailabilityRule[]>(
    () =>
      [...(rulesQuery.data ?? [])].sort(
        (a, b) =>
          WEEKDAY_ORDER.indexOf(a.dayOfWeek) -
            WEEKDAY_ORDER.indexOf(b.dayOfWeek) ||
          a.startTime.localeCompare(b.startTime),
      ),
    [rulesQuery.data],
  );

  return {
    addMeeting: (input: {
      mentorshipRequestId: string;
      scheduledAt: string;
      durationMinutes: number;
      agenda: string;
    }) => createMeeting.mutateAsync({ ...input, status: "SCHEDULED" }),
    isSavingMeeting: createMeeting.isPending,
    meetingError: createMeeting.error,
    mentorships,
    addRule: (input: {
      dayOfWeek: Weekday;
      startTime: string;
      endTime: string;
      slotMinutes: number;
    }) => createRule.mutateAsync(input),
    days,
    filter,
    freeSlotCount: slots.length,
    isLoading: meetingsQuery.isLoading || slotsQuery.isLoading,
    isSavingRule: createRule.isPending,
    meetings,
    nextWeek: () => setWeekOffset((current) => current + 1),
    previousWeek: () => setWeekOffset((current) => current - 1),
    removeRule: (ruleId: string) => removeRule.mutateAsync(ruleId),
    rules,
    ruleError: createRule.error ?? removeRule.error,
    setFilter,
    slots,
    thisWeek: () => setWeekOffset(0),
    weekStart,
  };
}
