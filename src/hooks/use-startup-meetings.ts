"use client";

import { useMemo, useState } from "react";

import { useMeetings } from "@/hooks/use-meetings";
import { useMentors } from "@/hooks/use-mentors";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { useStartupDocuments } from "@/hooks/use-startup-documents";
import type { MeetingItem } from "@/interfaces/meeting";
import { UserRole } from "@/interfaces/session";
import type { StartupDocument } from "@/interfaces/startup-document";
import {
  groupMeetingsByTopic,
  groupMeetingsByYear,
  MeetingTiming,
  meetingTiming,
  StartupMeetingView,
  visibleMeetings,
} from "@/lib/startup-meetings";

export enum MeetingLayout {
  Grid = "grid",
  List = "list",
}

export type MeetingDetails = {
  mentorTitle: string | null;
  summary: string | null;
  files: StartupDocument[];
};

export type MentorOption = { id: string; name: string };

// The meeting worth showing first: the next one ahead, else the last one held.
function focusMeeting(meetings: MeetingItem[]) {
  const ahead = meetings
    .filter((meeting) => meetingTiming(meeting) === MeetingTiming.Upcoming)
    .sort((left, right) => left.scheduledAt.localeCompare(right.scheduledAt));
  if (ahead.length > 0) return ahead[0];
  return (
    [...meetings].sort((left, right) =>
      right.scheduledAt.localeCompare(left.scheduledAt),
    )[0] ?? null
  );
}

// Notes are written during and after a meeting, so the notes view opens on
// the last one held and only falls back to the next one ahead.
function notesMeeting(meetings: MeetingItem[]) {
  const held = meetings
    .filter((meeting) => meetingTiming(meeting) === MeetingTiming.Held)
    .sort((left, right) => right.scheduledAt.localeCompare(left.scheduledAt));
  return held[0] ?? focusMeeting(meetings);
}

function monthKey(meeting: MeetingItem) {
  const date = new Date(meeting.scheduledAt);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** The Toplantılar tab: its meetings in three views, plus what each card needs. */
export function useStartupMeetings() {
  const meetingsQuery = useMeetings();
  const mentorsQuery = useMentors();
  const requestsQuery = useMentorshipRequests(UserRole.Mentee);
  const documentsQuery = useStartupDocuments();

  const [view, setView] = useState(StartupMeetingView.Topic);
  const [layout, setLayout] = useState(MeetingLayout.Grid);
  const [mentorId, setMentorId] = useState("");
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    null,
  );
  // undefined follows the default; null means the reader collapsed it.
  const [yearOverride, setYearOverride] = useState<number | null>();
  const [monthOverride, setMonthOverride] = useState<string | null>();

  const allMeetings = useMemo(
    () => visibleMeetings(meetingsQuery.data ?? []),
    [meetingsQuery.data],
  );
  const meetings = useMemo(
    () =>
      mentorId
        ? allMeetings.filter((meeting) => meeting.mentorId === mentorId)
        : allMeetings,
    [allMeetings, mentorId],
  );

  const mentorOptions = useMemo(() => {
    const options = new Map<string, string>();
    for (const meeting of allMeetings) {
      if (meeting.mentorId) {
        options.set(meeting.mentorId, meeting.mentorName ?? "Mentor");
      }
    }
    return [...options.entries()]
      .map(([id, name]): MentorOption => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name, "tr-TR"));
  }, [allMeetings]);

  const details = useMemo(() => {
    const titles = new Map(
      (mentorsQuery.data ?? []).map((mentor) => [
        mentor.id,
        mentor.professionalTitle || null,
      ]),
    );
    const summaries = new Map(
      (requestsQuery.data ?? []).map((request) => [
        request.id,
        request.summary?.trim() || request.supportArea || null,
      ]),
    );
    const files = new Map<string, StartupDocument[]>();
    for (const document of documentsQuery.data ?? []) {
      if (document.meetingId) {
        files.set(document.meetingId, [
          ...(files.get(document.meetingId) ?? []),
          document,
        ]);
      }
    }
    return (meeting: MeetingItem): MeetingDetails => ({
      mentorTitle: meeting.mentorId
        ? (titles.get(meeting.mentorId) ?? null)
        : null,
      summary: meeting.mentorshipRequestId
        ? (summaries.get(meeting.mentorshipRequestId) ?? null)
        : null,
      files: files.get(meeting.id) ?? [],
    });
  }, [mentorsQuery.data, requestsQuery.data, documentsQuery.data]);

  const topics = useMemo(() => groupMeetingsByTopic(meetings), [meetings]);
  const years = useMemo(() => groupMeetingsByYear(meetings), [meetings]);

  const defaultMonth = useMemo(() => {
    const meeting = focusMeeting(meetings);
    return meeting ? monthKey(meeting) : null;
  }, [meetings]);
  const expandedMonthKey =
    monthOverride === undefined ? defaultMonth : monthOverride;
  const expandedYear =
    yearOverride === undefined
      ? defaultMonth
        ? Number(defaultMonth.slice(0, 4))
        : (years[0]?.year ?? null)
      : yearOverride;

  const selectedMeeting = useMemo(
    () =>
      meetings.find((meeting) => meeting.id === selectedMeetingId) ??
      notesMeeting(meetings),
    [meetings, selectedMeetingId],
  );
  const otherMeetings = useMemo(
    () =>
      topics
        .map((topic) => topic.upcoming ?? topic.latest)
        .filter((meeting) => meeting.id !== selectedMeeting?.id),
    [topics, selectedMeeting],
  );

  return {
    details,
    error: meetingsQuery.error,
    expandedMonthKey,
    expandedYear,
    isLoading: meetingsQuery.isLoading,
    layout,
    meetingCount: meetings.length,
    mentorId,
    mentorOptions,
    openMeetingNotes: (meetingId: string) => {
      setSelectedMeetingId(meetingId);
      setView(StartupMeetingView.Notes);
    },
    otherMeetings,
    selectedMeeting,
    setLayout,
    setMentorId,
    setView,
    toggleMonth: (key: string) => {
      setYearOverride(Number(key.slice(0, 4)));
      setMonthOverride(expandedMonthKey === key ? null : key);
    },
    toggleYear: (year: number) => {
      setYearOverride(expandedYear === year ? null : year);
      setMonthOverride(null);
    },
    topics,
    view,
    years,
  };
}
