"use client";

import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import {
  AnnouncementAudience,
  type AnnouncementThread,
  type PostProgramAnnouncementInput,
} from "@/interfaces/program-announcement";
import {
  getMyAnnouncements,
  getProgramAnnouncements,
  postProgramAnnouncement,
} from "@/lib/client/program-announcements";
import { isEnumValue } from "@/lib/enum";
import { POLL_INTERVAL, polling } from "@/lib/poll";
import {
  announcementThreads,
  audienceOptions,
  MAX_ANNOUNCEMENT_LENGTH,
} from "@/lib/program-announcements";

export const ANNOUNCEMENTS_QUERY_KEY = ["program-announcements"] as const;

/** A team member's or mentor's read-only "Duyurular" threads, one per program. */
export function useMyAnnouncements() {
  const [openProgramId, setOpenProgramId] = useState<string | null>(null);
  const query = useQuery({
    queryKey: [...ANNOUNCEMENTS_QUERY_KEY, "mine"],
    queryFn: getMyAnnouncements,
    ...polling(POLL_INTERVAL.background),
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

/**
 * The coordinator's "Duyurular": one thread per program they run, and posting to the open one for everyone, only
 * its mentors, or only its teams (participants in an individual program).
 */
export function useCoordinatorAnnouncements(
  programs: { id: string; name: string; individualMentees: boolean }[],
) {
  const t = useTranslations("announcements");
  const queryClient = useQueryClient();
  const [openProgramId, setOpenProgramId] = useState<string | null>(null);
  // Read when a post settles: the coordinator may have opened another program meanwhile.
  const openRef = useRef<string | null>(null);
  const [draft, setDraft] = useState("");
  const [audience, setAudience] = useState(AnnouncementAudience.Everyone);
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
      individualProgram: program.individualMentees,
      latest: announcements[0] ?? null,
      announcements,
    };
  });
  const post = useMutation({
    mutationFn: ({
      programId,
      input,
    }: {
      programId: string;
      input: PostProgramAnnouncementInput;
    }) => postProgramAnnouncement(programId, input),
    onSuccess: (_created, { programId }) => {
      // Back to Herkes after each post, so a narrowed audience is never carried into the next one unnoticed.
      if (openRef.current === programId) {
        setDraft("");
        setAudience(AnnouncementAudience.Everyone);
      }
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
      openRef.current = programId;
      setDraft("");
      setAudience(AnnouncementAudience.Everyone);
      post.reset();
    },
    close: () => {
      setOpenProgramId(null);
      openRef.current = null;
    },
    draft,
    setDraft: (value: string) =>
      setDraft(value.slice(0, MAX_ANNOUNCEMENT_LENGTH)),
    audience,
    setAudience: (value: string) => {
      if (isEnumValue(AnnouncementAudience, value)) setAudience(value);
    },
    audienceOptions: audienceOptions(active?.individualProgram ?? false, t),
    canSend: Boolean(active) && trimmed.length > 0 && !post.isPending,
    send: () => {
      if (active && trimmed)
        post.mutate({
          programId: active.programId,
          input: { body: trimmed, audience },
        });
    },
    sending: post.isPending,
    sendError: post.error,
  };
}

export type CoordinatorAnnouncements = ReturnType<
  typeof useCoordinatorAnnouncements
>;
