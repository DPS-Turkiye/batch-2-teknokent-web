"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { MEETING_PROPOSALS_QUERY_KEY } from "@/hooks/use-meeting-proposals";
import { useMeetings } from "@/hooks/use-meetings";
import { mentorshipRequestsQueryKey } from "@/hooks/use-mentorship-requests";
import { useMobileTexts } from "@/hooks/use-mobile-texts";
import { ORGANIZATION_MEMBERS_QUERY_KEY } from "@/hooks/use-organization-members";
import { MobileConversationKind } from "@/interfaces/mobile";
import { UserRole } from "@/interfaces/session";
import { monthLabel } from "@/lib/calendar";
import { getMyMeetingProposals } from "@/lib/client/meeting-proposals";
import { getMentorRequests } from "@/lib/client/mentor-requests";
import { getOrganizationMembersById } from "@/lib/client/organization-members";
import { getMemberProgramEvents } from "@/lib/client/programs";
import { mobileChatHref } from "@/lib/mobile";
import {
  agendaDays,
  agendaEntries,
  canJoin,
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
import {
  mentorAgendaEntries,
  mentorAwaitingEntries,
  mentorEntryDetail,
} from "@/lib/mobile-mentor-calendar";

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

  const { session } = useSession();
  const texts = useMobileTexts();
  const isMentor = session?.role === UserRole.Mentor;
  const range = useMemo(() => eventRangeFor(month), [month]);
  const meetings = useMeetings();
  const events = useQuery({
    queryKey: [MEMBER_PROGRAM_EVENTS_QUERY_KEY, range],
    queryFn: () => getMemberProgramEvents(range),
  });
  // Mentors see meetings by startup and topic; without the requests they fall back to the agenda.
  const requests = useQuery({
    queryKey: mentorshipRequestsQueryKey(UserRole.Mentor),
    queryFn: () => getMentorRequests(UserRole.Mentor),
    enabled: isMentor,
  });
  const proposals = useQuery({
    queryKey: [...MEETING_PROPOSALS_QUERY_KEY, "mine"],
    queryFn: getMyMeetingProposals,
    enabled: isMentor,
  });

  const entries = useMemo(() => {
    const all = agendaEntries(meetings.data ?? [], events.data ?? [], texts);
    if (!isMentor) return all;
    return [
      ...mentorAgendaEntries(all, requests.data ?? [], texts),
      ...mentorAwaitingEntries(
        proposals.data ?? [],
        requests.data ?? [],
        texts,
        now,
      ),
    ].sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
  }, [
    meetings.data,
    events.data,
    isMentor,
    requests.data,
    proposals.data,
    now,
    texts,
  ]);

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
  const requestId = open?.meeting?.mentorshipRequestId ?? open?.requestId;
  const organizationId = open?.meeting?.organizationId ?? "";
  const members = useQuery({
    queryKey: [...ORGANIZATION_MEMBERS_QUERY_KEY, organizationId],
    queryFn: () => getOrganizationMembersById(organizationId),
    enabled: isMentor && Boolean(organizationId),
    retry: false,
  });

  return {
    agenda: agendaDays(selected, entries, now, texts),
    closeEntry: () => setOpenId(null),
    detail: open
      ? {
          entry: open,
          kindLabel: open.awaitingApproval
            ? texts.t("calendar.awaitingApproval")
            : texts.t(`calendar.kinds.${open.kind}`),
          timeLine: entryTimeLine(open, texts),
          timeHint: entryTimeHint(open, now, texts.t),
          link: open.meeting?.meetLink
            ? {
                href: open.meeting.meetLink,
                label: meetingLinkLabel(open.meeting.meetLink, texts.t),
                text: meetingLinkText(open.meeting.meetLink),
              }
            : null,
          canJoin: canJoin(open, now),
          isOver: open.endsAt <= now,
          messageHref: requestId
            ? mobileChatHref(MobileConversationKind.Mentorship, requestId)
            : null,
          mentor: isMentor
            ? mentorEntryDetail({
                entry: open,
                meetings: meetings.data ?? [],
                requests: requests.data ?? [],
                members: members.data ?? [],
                mentorName: session.fullName,
                texts,
                now,
              })
            : null,
        }
      : null,
    isError: Boolean(meetings.error && events.error),
    isMentor,
    isLoading: meetings.isLoading,
    month: {
      isOpen: isMonthOpen,
      label: monthLabel(month, texts.locale),
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
    nextLabel: next ? nextEntryLabel(next, now, texts.t) : null,
    openEntry: (id: string) => setOpenId(id),
    retry: () => {
      void meetings.refetch();
      void events.refetch();
    },
    selectDay,
    strip: weekStrip(selected, entries, now, texts.locale),
    title: monthLabel(selected, texts.locale),
  };
}
