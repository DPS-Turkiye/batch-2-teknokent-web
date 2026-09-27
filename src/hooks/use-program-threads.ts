"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { COORDINATOR_CONVERSATIONS_QUERY_KEY } from "@/hooks/use-coordinator-messages";
import {
  getCoordinatorConversations,
  getCoordinatorMessages,
  sendCoordinatorMessage,
} from "@/lib/client/coordinator-conversations";
import { MAX_MESSAGE_LENGTH } from "@/lib/coordinator-messages";

const POLL_MS = 15_000;

/** A team's or mentor's threads with their program coordinators, shown in the web Mesajlar. */
export function useProgramThreads() {
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const threads = useQuery({
    queryKey: COORDINATOR_CONVERSATIONS_QUERY_KEY,
    queryFn: () => getCoordinatorConversations(),
    refetchInterval: POLL_MS,
  });
  const messages = useQuery({
    queryKey: [...COORDINATOR_CONVERSATIONS_QUERY_KEY, "messages", openId],
    queryFn: () => getCoordinatorMessages(openId ?? ""),
    enabled: !!openId,
    refetchInterval: POLL_MS,
  });

  const active = threads.data?.find((thread) => thread.id === openId) ?? null;
  // Loading a thread's messages marks it read on the server; the list only needs refreshing.
  const activeUnread = active?.unread ?? false;
  useEffect(() => {
    if (messages.dataUpdatedAt && activeUnread) {
      void queryClient.invalidateQueries({
        queryKey: COORDINATOR_CONVERSATIONS_QUERY_KEY,
      });
    }
  }, [messages.dataUpdatedAt, activeUnread, queryClient]);

  const send = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      sendCoordinatorMessage(id, body),
    onSuccess: () => {
      setDraft("");
      void queryClient.invalidateQueries({
        queryKey: COORDINATOR_CONVERSATIONS_QUERY_KEY,
      });
    },
  });
  const trimmed = draft.trim();

  return {
    threads: threads.data ?? [],
    error: threads.error,
    openId,
    active,
    open: (id: string) => {
      setOpenId(id);
      setDraft("");
    },
    close: () => setOpenId(null),
    messages: messages.data ?? [],
    messagesLoading: messages.isLoading,
    draft,
    setDraft: (value: string) => setDraft(value.slice(0, MAX_MESSAGE_LENGTH)),
    canSend: !!active && trimmed.length > 0 && !send.isPending,
    send: () => {
      if (active && trimmed) send.mutate({ id: active.id, body: trimmed });
    },
    sendError: send.error,
  };
}

export type ProgramThreads = ReturnType<typeof useProgramThreads>;
