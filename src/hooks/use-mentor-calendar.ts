"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import {
  mentorshipRequestsQueryKey,
  useMentorshipRequests,
} from "@/hooks/use-mentorship-requests";
import { usePrograms } from "@/hooks/use-programs";
import type { MeetingItem } from "@/interfaces/meeting";
import {
  Weekday,
  WEEKDAY_ORDER,
  type MentorAvailabilityRule,
  type MentorAvailabilitySlot,
} from "@/interfaces/mentor";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import {
  getMeetings,
  postMeeting,
  postMeetingGuest,
  deleteMeeting,
} from "@/lib/client/meetings";
import { getRegularMentorships } from "@/lib/client/mentorships";
import {
  createAvailabilityRule,
  deleteAvailabilityRule,
  getAvailabilityRules,
  getMentorAvailability,
} from "@/lib/client/mentor-profile";
import { programsMentorHasJoined } from "@/lib/meeting-targets";
import { useMentorAvailabilitySettings } from "@/hooks/use-mentor-profile";
import { exceptionLabel, exceptionsInRange } from "@/lib/mentor-availability";
import { weeklyAvailabilityRows } from "@/lib/mentor-profile-overview";
import { CalendarFilter, startOfWeek, weekDays } from "@/lib/calendar";
import { REGULAR_MENTORSHIPS_QUERY_KEY } from "@/components/mentorships/regular-mentorships-tab";

/** The grid runs 09:00–18:00, matching the design. */
export const CALENDAR_HOURS = Array.from({ length: 10 }, (_, i) => 9 + i);

export const AVAILABILITY_RULES_KEY = ["mentor-availability-rules"] as const;
export const AVAILABILITY_SLOTS_KEY = ["mentor-availability-slots"] as const;

export function useMentorCalendar() {
  const locale = useLocale();
  const tSchedule = useTranslations("mentorSchedule");
  const tOptions = useTranslations("options");
  const queryClient = useQueryClient();
  const { session } = useSession();
  const [weekOffset, setWeekOffset] = useState(0);
  const [filter, setFilter] = useState<CalendarFilter>(CalendarFilter.All);

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date());
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [weekOffset]);

  const days = useMemo(() => weekDays(weekStart, 5), [weekStart]);

  const meetingsQuery = useQuery({
    queryKey: ["meetings"],
    queryFn: () => getMeetings(),
  });
  const rulesQuery = useQuery({
    queryKey: AVAILABILITY_RULES_KEY,
    queryFn: getAvailabilityRules,
  });
  const slotsQuery = useQuery({
    queryKey: AVAILABILITY_SLOTS_KEY,
    queryFn: getMentorAvailability,
  });
  const settingsQuery = useMentorAvailabilitySettings();

  function invalidateAvailability() {
    void queryClient.invalidateQueries({ queryKey: AVAILABILITY_RULES_KEY });
    void queryClient.invalidateQueries({ queryKey: AVAILABILITY_SLOTS_KEY });
  }

  const requestsQuery = useMentorshipRequests(UserRole.Mentor);
  const programsQuery = usePrograms();
  const regularMentorshipsQuery = useQuery({
    queryKey: [...REGULAR_MENTORSHIPS_QUERY_KEY, UserRole.Mentor],
    queryFn: () => getRegularMentorships(UserRole.Mentor),
  });

  const programs = useMemo(
    () => programsMentorHasJoined(programsQuery.data ?? [], session?.userId),
    [programsQuery.data, session?.userId],
  );

  const mentorships = useMemo<MentorshipRequest[]>(
    () =>
      (requestsQuery.data ?? []).filter(
        (request) => request.status === MentorshipRequestStatus.Accepted,
      ),
    [requestsQuery.data],
  );

  const regularMentorships = regularMentorshipsQuery.data ?? [];

  const createMeeting = useMutation({
    mutationFn: postMeeting,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
      void queryClient.invalidateQueries({ queryKey: ["meeting-room"] });
      void queryClient.invalidateQueries({
        queryKey: mentorshipRequestsQueryKey(UserRole.Mentor),
      });
    },
  });
  const inviteGuest = useMutation({
    mutationFn: ({
      meetingId,
      payload,
    }: {
      meetingId: string;
      payload: {
        organizationId?: string;
        mentorId?: string;
        programId?: string;
      };
    }) => postMeetingGuest(meetingId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
      void queryClient.invalidateQueries({ queryKey: ["meeting-room"] });
      void queryClient.invalidateQueries({
        queryKey: mentorshipRequestsQueryKey(UserRole.Mentor),
      });
    },
  });
  const removeMeeting = useMutation({
    mutationFn: deleteMeeting,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
      void queryClient.invalidateQueries({ queryKey: ["meeting-room"] });
      void queryClient.invalidateQueries({
        queryKey: mentorshipRequestsQueryKey(UserRole.Mentor),
      });
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
    if (filter === CalendarFilter.Availability) return [];
    return (meetingsQuery.data ?? []).filter((meeting) => {
      const at = new Date(meeting.scheduledAt);
      return at >= weekStart && at < weekEnd;
    });
  }, [meetingsQuery.data, filter, weekStart, weekEnd]);

  const slots = useMemo<MentorAvailabilitySlot[]>(
    () =>
      filter === CalendarFilter.Mentorship || filter === CalendarFilter.Program
        ? []
        : (slotsQuery.data ?? []).filter((slot) => {
            const at = new Date(slot.startsAt);
            return !slot.booked && at >= weekStart && at < weekEnd;
          }),
    [slotsQuery.data, filter, weekStart, weekEnd],
  );

  /** The "next 7 days" strip in the meeting dialog ignores the browsed week. */
  const upcomingSlots = useMemo<MentorAvailabilitySlot[]>(() => {
    const now = new Date();
    const horizon = new Date(now);
    horizon.setDate(horizon.getDate() + 7);
    return (slotsQuery.data ?? [])
      .filter((slot) => {
        const at = new Date(slot.startsAt);
        return !slot.booked && at >= now && at < horizon;
      })
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [slotsQuery.data]);

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

  const weekExceptionLabels = useMemo(
    () =>
      exceptionsInRange(
        settingsQuery.data?.exceptions ?? [],
        days[0],
        days[days.length - 1],
      ).map((exception) => exceptionLabel(exception, locale)),
    [settingsQuery.data?.exceptions, days, locale],
  );

  return {
    availabilityRows: weeklyAvailabilityRows(rules, {
      weekday: (day) => tOptions(`weekday.${day}`),
      otherDays: tSchedule("otherDays"),
      closed: tSchedule("closed"),
    }),
    weekExceptionLabels,
    addMeeting: (input: {
      mentorshipRequestId?: string;
      programId?: string;
      organizationId?: string;
      scheduledAt: string;
      durationMinutes: number;
      agenda: string;
      meetLink?: string;
      transcribeRequested?: boolean;
      requestedDocuments?: string[];
    }) => createMeeting.mutateAsync({ ...input, status: "SCHEDULED" }),
    inviteGuest: (
      meetingId: string,
      payload: {
        organizationId?: string;
        mentorId?: string;
        programId?: string;
      },
    ) => inviteGuest.mutateAsync({ meetingId, payload }),
    removeMeeting: (meetingId: string) => removeMeeting.mutateAsync(meetingId),
    isSavingMeeting:
      createMeeting.isPending ||
      inviteGuest.isPending ||
      removeMeeting.isPending,
    meetingError:
      createMeeting.error ?? inviteGuest.error ?? removeMeeting.error,
    mentorships,
    regularMentorships,
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
    programs,
    removeRule: (ruleId: string) => removeRule.mutateAsync(ruleId),
    rules,
    ruleError: createRule.error ?? removeRule.error,
    setFilter,
    slots,
    upcomingSlots,
    thisWeek: () => setWeekOffset(0),
    weekStart,
  };
}
