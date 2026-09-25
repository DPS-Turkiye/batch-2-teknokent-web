"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useMeetings } from "@/hooks/use-meetings";
import { MobileConversationKind } from "@/interfaces/mobile";
import { monthLabel } from "@/lib/calendar";
import { getMemberProgramEvents } from "@/lib/client/programs";
import { mobileChatHref } from "@/lib/mobile";
import {
  agendaDays,
  agendaEntries,
  canJoin,
  ENTRY_KIND_LABELS,
  entryTimeHint,
  entryTimeLine,
  eventRangeFor,
  meetingLinkLabel,
  meetingLinkText,
  monthCells,
  nextEntry,
  nextEntryLabel,
  shiftMonth,
  startOfDay,
  weekStrip,
} from "@/lib/mobile-calendar";

const NOW_REFRESH_MS = 60_000;

export const MEMBER_PROGRAM_EVENTS_QUERY_KEY = "member-program-events";

export function useMobileCalendar() {
  const linkedMeetingId = useSearchParams().get("meeting");
  const [now, setNow] = useState(() => new Date());
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const [month, setMonth] = useState(() => shiftMonth(new Date(), 0));
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [linkHandled, setLinkHandled] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), NOW_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  const range = useMemo(() => eventRangeFor(month), [month]);
  const meetings = useMeetings();
  const events = useQuery({
    queryKey: [MEMBER_PROGRAM_EVENTS_QUERY_KEY, range],
    queryFn: () => getMemberProgramEvents(range),
  });

  const entries = useMemo(
    () => agendaEntries(meetings.data ?? [], events.data ?? []),
    [meetings.data, events.data],
  );

  // A link from Home opens that meeting once the meetings have loaded.
  const linked =
    !linkHandled && linkedMeetingId
      ? entries.find((entry) => entry.id === `meeting:${linkedMeetingId}`)
      : undefined;
  if (linked) {
    setLinkHandled(true);
    setSelected(startOfDay(linked.startsAt));
    setMonth(shiftMonth(linked.startsAt, 0));
    setOpenId(linked.id);
  }

  const selectDay = (day: Date) => {
    setSelected(startOfDay(day));
    setMonth(shiftMonth(day, 0));
  };

  const next = nextEntry(entries, now);
  const open = entries.find((entry) => entry.id === openId) ?? null;
  const requestId = open?.meeting?.mentorshipRequestId;

  return {
    agenda: agendaDays(selected, entries, now),
    closeEntry: () => setOpenId(null),
    detail: open
      ? {
          entry: open,
          kindLabel: ENTRY_KIND_LABELS[open.kind],
          timeLine: entryTimeLine(open),
          timeHint: entryTimeHint(open, now),
          link: open.meeting?.meetLink
            ? {
                href: open.meeting.meetLink,
                label: meetingLinkLabel(open.meeting.meetLink),
                text: meetingLinkText(open.meeting.meetLink),
              }
            : null,
          canJoin: canJoin(open, now),
          isOver: open.endsAt <= now,
          messageHref: requestId
            ? mobileChatHref(MobileConversationKind.Mentorship, requestId)
            : null,
        }
      : null,
    isError: Boolean(meetings.error && events.error),
    isLoading: meetings.isLoading,
    month: {
      isOpen: isMonthOpen,
      label: monthLabel(month),
      cells: monthCells(month, entries, selected, now),
      open: () => setIsMonthOpen(true),
      close: () => setIsMonthOpen(false),
      previous: () => setMonth((current) => shiftMonth(current, -1)),
      next: () => setMonth((current) => shiftMonth(current, 1)),
      pick: (day: Date) => {
        selectDay(day);
        setIsMonthOpen(false);
      },
      today: () => {
        selectDay(new Date());
        setIsMonthOpen(false);
      },
    },
    nextId: next?.id ?? null,
    nextLabel: next ? nextEntryLabel(next, now) : null,
    openEntry: (id: string) => setOpenId(id),
    retry: () => {
      void meetings.refetch();
      void events.refetch();
    },
    selectDay,
    strip: weekStrip(selected, entries, now),
    title: monthLabel(selected),
  };
}
