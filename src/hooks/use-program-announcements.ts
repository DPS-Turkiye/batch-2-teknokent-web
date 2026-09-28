"use client";

import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";

import type { AnnouncementThread } from "@/interfaces/program-announcement";
import {
  getMyAnnouncements,
  getProgramAnnouncements,
  postProgramAnnouncement,
} from "@/lib/client/program-announcements";
import {
  announcementThreads,
  MAX_ANNOUNCEMENT_LENGTH,
} from "@/lib/program-announcements";

export const ANNOUNCEMENTS_QUERY_KEY = ["program-announcements"] as const;
const POLL_MS = 60_000;

/** A team member's or mentor's read-only "Duyurular" threads, one per program. */
export function useMyAnnouncements() {
  const [openProgramId, setOpenProgramId] = useState<string | null>(null);
  const query = useQuery({
    queryKey: [...ANNOUNCEMENTS_QUERY_KEY, "mine"],
    queryFn: getMyAnnouncements,
    refetchInterval: POLL_MS,
  });
  const threads = announcementThreads(query.data ?? []);
  return {
    threads,
    openProgramId,
    active:
      threads.find((thread) => thread.programId === openProgramId) ?? null,
    open: setOpenProgramId,
    close: () => setOpenProgramId(null),
  };
}

export type MyAnnouncements = ReturnType<typeof useMyAnnouncements>;

/** The coordinator's "Duyurular": one thread per program they run, and posting to the open one. */
export function useCoordinatorAnnouncements(
  programs: { id: string; name: string }[],
) {
  const queryClient = useQueryClient();
  const [openProgramId, setOpenProgramId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const lists = useQueries({
    queries: programs.map((program) => ({
      queryKey: [...ANNOUNCEMENTS_QUERY_KEY, "program", program.id],
      queryFn: () => getProgramAnnouncements(program.id),
    })),
  });
  const threads: AnnouncementThread[] = programs.map((program, index) => {
    const announcements = lists[index]?.data ?? [];
    return {
      programId: program.id,
      programName: program.name,
      latest: announcements[0] ?? null,
      announcements,
    };
  });
  const post = useMutation({
    mutationFn: ({ programId, body }: { programId: string; body: string }) =>
      postProgramAnnouncement(programId, body),
    onSuccess: (_created, { programId }) => {
      setDraft("");
      void queryClient.invalidateQueries({
        queryKey: [...ANNOUNCEMENTS_QUERY_KEY, "program", programId],
      });
    },
  });
  const trimmed = draft.trim();
  const active =
    threads.find((thread) => thread.programId === openProgramId) ?? null;

  return {
    threads,
    openProgramId,
    active,
    open: (programId: string) => {
      setOpenProgramId(programId);
      setDraft("");
      post.reset();
    },
    close: () => setOpenProgramId(null),
    draft,
    setDraft: (value: string) =>
      setDraft(value.slice(0, MAX_ANNOUNCEMENT_LENGTH)),
    canSend: !!active && trimmed.length > 0 && !post.isPending,
    send: () => {
      if (active && trimmed)
        post.mutate({ programId: active.programId, body: trimmed });
    },
    sending: post.isPending,
    sendError: post.error,
  };
}

export type CoordinatorAnnouncements = ReturnType<
  typeof useCoordinatorAnnouncements
>;
