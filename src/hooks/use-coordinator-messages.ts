"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { useCoordinatorMentorships } from "@/hooks/use-coordinator-mentorships";
import { useCoordinatorPrograms } from "@/hooks/use-coordinator-programs";
import { useCoordinatorAnnouncements } from "@/hooks/use-program-announcements";
import {
  CoordinatorConversationCounterpart,
  type CoordinatorConversation,
  type StartCoordinatorConversationInput,
} from "@/interfaces/coordinator-conversation";
import { ProgramMentorStatus } from "@/interfaces/program";
import {
  getCoordinatorConversations,
  getCoordinatorMessages,
  sendCoordinatorMessage,
  startCoordinatorConversation,
} from "@/lib/client/coordinator-conversations";
import { getProgramDetail } from "@/lib/client/programs";
import {
  counterpartSubtitle,
  filterConversations,
  MAX_MESSAGE_LENGTH,
  MessageFilter,
  messageFilterOptions,
  messagesSubtitle,
  relatedMentorships,
} from "@/lib/coordinator-messages";
import { POLL_INTERVAL, polling } from "@/lib/poll";

export const COORDINATOR_CONVERSATIONS_QUERY_KEY = [
  "coordinator-conversations",
] as const;

export type MessagesDeepLink = {
  conversationId: string | null;
  start: StartCoordinatorConversationInput | null;
};

/**
 * Mesajlar: the thread list, the open thread, sending, starting a thread with a team or mentor, and the
 * "Duyurular" filter's program-wide announcements.
 */
export function useCoordinatorMessages(link: MessagesDeepLink) {
  const t = useTranslations("coordinatorMessages");
  const queryClient = useQueryClient();
  const programs = useCoordinatorPrograms();
  const mentorships = useCoordinatorMentorships(null);
  const [programId, setProgramId] = useState<string | null>(
    link.start?.programId ?? null,
  );
  const [filter, setFilter] = useState(MessageFilter.All);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(link.conversationId);
  const [draft, setDraft] = useState("");
  const [composing, setComposing] = useState(false);

  const programList = programs.data ?? [];
  const announcements = useCoordinatorAnnouncements(
    programList.filter((program) => !programId || program.id === programId),
  );

  const conversations = useQuery({
    queryKey: COORDINATOR_CONVERSATIONS_QUERY_KEY,
    queryFn: () => getCoordinatorConversations(),
    ...polling(POLL_INTERVAL.messages),
  });
  const messages = useQuery({
    queryKey: [...COORDINATOR_CONVERSATIONS_QUERY_KEY, "messages", openId],
    queryFn: () => getCoordinatorMessages(openId ?? ""),
    enabled: Boolean(openId),
    ...polling(POLL_INTERVAL.messages),
  });

  const refreshList = () =>
    queryClient.invalidateQueries({
      queryKey: COORDINATOR_CONVERSATIONS_QUERY_KEY,
    });

  const start = useMutation({
    mutationFn: (input: StartCoordinatorConversationInput) =>
      startCoordinatorConversation(input),
    onSuccess: (conversation) => {
      setOpenId(conversation.id);
      setComposing(false);
      void refreshList();
    },
  });
  const send = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      sendCoordinatorMessage(id, body),
    onSuccess: () => {
      setDraft("");
      void refreshList();
    },
  });

  // A link from the drawer or the calendar names a mentor or team; open (or create) that thread once.
  const startedFromLink = useRef(false);
  const startFromLink = start.mutate;
  useEffect(() => {
    if (link.start && !startedFromLink.current) {
      startedFromLink.current = true;
      startFromLink(link.start);
    }
  }, [link.start, startFromLink]);

  const all = conversations.data ?? [];
  const rows = mentorships.data ?? [];
  const open = all.find((item) => item.id === openId) ?? null;
  const related = open ? relatedMentorships(open, rows) : [];
  const trimmed = draft.trim();

  return {
    conversations,
    programOptions: programList,
    announcements,
    openAnnouncements: (programId: string) => {
      setOpenId(null);
      announcements.open(programId);
    },
    programId,
    setProgramId,
    filter,
    setFilter,
    filterOptions: messageFilterOptions(all, openId, t),
    search,
    setSearch,
    visible: filterConversations(all, { filter, search, programId }),
    subtitle: messagesSubtitle(all, rows, openId, t),
    subtitleOf: (conversation: CoordinatorConversation) =>
      counterpartSubtitle(
        conversation,
        relatedMentorships(conversation, rows),
        t,
      ),
    openId,
    openConversation: (id: string) => {
      announcements.close();
      setOpenId(id);
      setDraft("");
      void refreshList();
    },
    open,
    related,
    messages,
    draft,
    setDraft: (value: string) => setDraft(value.slice(0, MAX_MESSAGE_LENGTH)),
    canSend: Boolean(open) && trimmed.length > 0 && !send.isPending,
    sendMessage: () => {
      if (open && trimmed) send.mutate({ id: open.id, body: trimmed });
    },
    sending: send.isPending,
    sendError: send.error,
    startError: start.error,
    composing,
    openComposer: () => {
      start.reset();
      setComposing(true);
    },
    closeComposer: () => setComposing(false),
    startConversation: (input: StartCoordinatorConversationInput) =>
      start.mutate(input),
    starting: start.isPending,
  };
}

/** The "Yeni mesaj" picker: the chosen program's teams and accepted mentors. */
export function useConversationTargets(programId: string | null) {
  const detail = useQuery({
    queryKey: ["program-detail", programId],
    queryFn: () => getProgramDetail(programId ?? ""),
    enabled: Boolean(programId),
  });
  const teams = (detail.data?.startups ?? []).map((startup) => ({
    type: CoordinatorConversationCounterpart.Team,
    id: startup.id,
    name: startup.name,
  }));
  const mentors = (detail.data?.mentors ?? [])
    .filter((mentor) => mentor.status === ProgramMentorStatus.Accepted)
    .map((mentor) => ({
      type: CoordinatorConversationCounterpart.Mentor,
      id: mentor.mentorId,
      name: mentor.fullName,
    }));
  return { detail, targets: [...teams, ...mentors] };
}
