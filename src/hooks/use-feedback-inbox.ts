"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type { ProgramType } from "@/interfaces/program";
import {
  getPlatformFeedbackInbox,
  readPlatformFeedback,
} from "@/lib/client/platform-feedback";

export const FEEDBACK_INBOX_QUERY_KEY = ["platform-feedback-inbox"] as const;

export function useFeedbackInbox() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [programType, setProgramType] = useState<ProgramType | null>(null);
  const query = useQuery({
    queryKey: [...FEEDBACK_INBOX_QUERY_KEY, page, unreadOnly, programType],
    queryFn: () => getPlatformFeedbackInbox(page, unreadOnly, programType),
  });
  const read = useMutation({
    mutationFn: readPlatformFeedback,
    onSuccess: async () => {
      if (unreadOnly) setPage(0);
      await queryClient.invalidateQueries({
        queryKey: FEEDBACK_INBOX_QUERY_KEY,
      });
    },
  });

  return {
    data: query.data,
    error: query.error,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
    page,
    unreadOnly,
    programType,
    filterProgramType: (value: ProgramType | null) => {
      setProgramType(value);
      setPage(0);
      read.reset();
    },
    filterUnread: (value: boolean) => {
      setUnreadOnly(value);
      setPage(0);
      read.reset();
    },
    previous: () => setPage((value) => Math.max(0, value - 1)),
    next: () => {
      if (query.data && page + 1 < query.data.page.totalPages)
        setPage((value) => value + 1);
    },
    markRead: read.mutate,
    isMarkingRead: read.isPending,
    markingId: read.isPending ? read.variables : null,
    readError: read.error,
  };
}
