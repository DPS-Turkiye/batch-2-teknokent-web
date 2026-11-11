"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { MEETINGS_QUERY_KEY } from "@/hooks/use-meetings";
import type { MeetingItem } from "@/interfaces/meeting";
import type { ProposeMeetingInput } from "@/interfaces/meeting-proposal";
import { ToastTone } from "@/interfaces/toast";
import {
  acceptMeetingProposal,
  declineMeetingProposal,
  getMentorshipMeetingProposals,
  getMyMeetingProposals,
  proposeMeeting,
  proposeReschedule,
  remindMeetingProposal,
  withdrawMeetingProposal,
} from "@/lib/client/meeting-proposals";
import {
  DEFAULT_PROPOSAL_DURATION,
  defaultProposalStart,
  lastDeclined,
  MAX_PROPOSAL_AGENDA,
  openProposal,
} from "@/lib/meeting-proposals";
import { POLL_INTERVAL, polling } from "@/lib/poll";
import { toDateTimeLocalValue } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

export const MEETING_PROPOSALS_QUERY_KEY = ["meeting-proposals"] as const;

export function useMyMeetingProposalsQuery() {
  return useQuery({
    queryKey: [...MEETING_PROPOSALS_QUERY_KEY, "mine"],
    queryFn: getMyMeetingProposals,
    ...polling(POLL_INTERVAL.background),
  });
}

/** The mentor's or the team's open coordinator proposals, with accept and decline-with-reason. */
export function useMeetingProposals() {
  const queryClient = useQueryClient();
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const proposals = useMyMeetingProposalsQuery();
  const refresh = () => {
    void queryClient.invalidateQueries({
      queryKey: MEETING_PROPOSALS_QUERY_KEY,
    });
    void queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY });
  };
  const accept = useMutation({
    mutationFn: acceptMeetingProposal,
    onSuccess: refresh,
  });
  const decline = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      declineMeetingProposal(id, text),
    onSuccess: () => {
      setDecliningId(null);
      setReason("");
      refresh();
    },
  });

  return {
    proposals: proposals.data ?? [],
    isLoading: proposals.isLoading,
    accept: (id: string) => accept.mutate(id),
    accepting: accept.isPending ? accept.variables : null,
    decliningId,
    startDecline: (id: string) => {
      decline.reset();
      setReason("");
      setDecliningId(id);
    },
    cancelDecline: () => setDecliningId(null),
    reason,
    setReason: (value: string) =>
      setReason(value.slice(0, MAX_PROPOSAL_AGENDA)),
    confirmDecline: () => {
      if (decliningId) decline.mutate({ id: decliningId, text: reason });
    },
    declining: decline.isPending,
    error: accept.error ?? decline.error,
  };
}

/**
 * The coordinator drawer's "Görüşme planla": the mentorship's proposals, the propose form, remind and withdraw.
 * With `reschedule`, the form opens at once and proposes a new time for that meeting (the calendar's
 * "Yeniden planla"); `onDone` runs when it closes.
 */
export function useMentorshipMeetingProposals(
  mentorshipId: string,
  options: { reschedule?: string; onDone?: () => void } = {},
) {
  const queryClient = useQueryClient();
  const key = [...MEETING_PROPOSALS_QUERY_KEY, "mentorship", mentorshipId];
  const [composing, setComposing] = useState(Boolean(options.reschedule));
  const [startsAt, setStartsAt] = useState(() =>
    toDateTimeLocalValue(defaultProposalStart()),
  );
  const [duration, setDuration] = useState(DEFAULT_PROPOSAL_DURATION);
  const [agenda, setAgenda] = useState("");

  const proposals = useQuery({
    queryKey: key,
    queryFn: () => getMentorshipMeetingProposals(mentorshipId),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: key });

  const propose = useMutation({
    mutationFn: (input: ProposeMeetingInput) =>
      proposeMeeting(mentorshipId, input),
    onSuccess: () => {
      setComposing(false);
      setAgenda("");
      void queryClient.invalidateQueries({
        queryKey: MEETING_PROPOSALS_QUERY_KEY,
      });
      options.onDone?.();
    },
  });
  const remind = useMutation({ mutationFn: remindMeetingProposal });
  const withdraw = useMutation({
    mutationFn: withdrawMeetingProposal,
    onSuccess: () => void refresh(),
  });

  const list = proposals.data ?? [];
  const open = openProposal(list);

  return {
    query: proposals,
    open,
    latest: list[0] ?? null,
    declined: open ? null : lastDeclined(list),
    composing,
    openComposer: () => {
      propose.reset();
      setComposing(true);
    },
    closeComposer: () => {
      setComposing(false);
      options.onDone?.();
    },
    rescheduling: Boolean(options.reschedule),
    startsAt,
    setStartsAt,
    duration,
    setDuration,
    agenda,
    setAgenda: (value: string) =>
      setAgenda(value.slice(0, MAX_PROPOSAL_AGENDA)),
    canPropose: Boolean(startsAt) && !propose.isPending,
    propose: () =>
      propose.mutate({
        scheduledAt: new Date(startsAt).toISOString(),
        durationMinutes: duration,
        agenda: agenda.trim() || null,
        replacesMeetingId: options.reschedule ?? null,
      }),
    proposing: propose.isPending,
    proposeError: propose.error,
    remind: () => {
      if (open) remind.mutate(open.id);
    },
    reminding: remind.isPending,
    reminded: remind.isSuccess,
    withdraw: () => {
      if (open) withdraw.mutate(open.id);
    },
    withdrawing: withdraw.isPending,
    actionError: remind.error ?? withdraw.error,
  };
}

export type MentorshipMeetingProposals = ReturnType<
  typeof useMentorshipMeetingProposals
>;

/**
 * "Yeni saat öner" on a mentor's or a team's own meeting: the new time goes to the other side, and the meeting
 * moves once they confirm. The proposer's side counts as already accepted.
 */
export function useRescheduleMeeting(meeting: MeetingItem) {
  const t = useTranslations("sharedUi");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [composing, setComposing] = useState(false);
  const [startsAt, setStartsAt] = useState(() =>
    toDateTimeLocalValue(new Date(meeting.scheduledAt)),
  );
  const [duration, setDuration] = useState(
    meeting.durationMinutes || DEFAULT_PROPOSAL_DURATION,
  );
  const propose = useMutation({
    mutationFn: () =>
      proposeReschedule(meeting.id, {
        scheduledAt: new Date(startsAt).toISOString(),
        durationMinutes: duration,
      }),
    onSuccess: () => {
      setComposing(false);
      void queryClient.invalidateQueries({
        queryKey: MEETING_PROPOSALS_QUERY_KEY,
      });
      showToast({
        message: t("rescheduleProposed"),
        tone: ToastTone.Success,
      });
    },
  });

  return {
    composing,
    openComposer: () => {
      propose.reset();
      setComposing(true);
    },
    closeComposer: () => setComposing(false),
    rescheduling: true,
    startsAt,
    setStartsAt,
    duration,
    setDuration,
    agenda: "",
    setAgenda: () => undefined,
    canPropose: Boolean(startsAt) && !propose.isPending,
    propose: () => propose.mutate(),
    proposeError: propose.error,
  };
}
