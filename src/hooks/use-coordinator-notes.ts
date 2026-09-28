"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  addCoordinatorNote,
  deleteCoordinatorNote,
  getCoordinatorNotes,
} from "@/lib/client/coordinator-notes";

export const MAX_COORDINATOR_NOTE = 2000;

export const coordinatorNotesQueryKey = (mentorshipId: string) =>
  ["coordinator-notes", mentorshipId] as const;

/** "Koordinatör notu ekle": a mentorship's coordinator-only notes, the composer and deleting your own. */
export function useCoordinatorNotes(mentorshipId: string) {
  const queryClient = useQueryClient();
  const key = coordinatorNotesQueryKey(mentorshipId);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");

  const notes = useQuery({
    queryKey: key,
    queryFn: () => getCoordinatorNotes(mentorshipId),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: key });
  const add = useMutation({
    mutationFn: (body: string) => addCoordinatorNote(mentorshipId, body),
    onSuccess: () => {
      setDraft("");
      setComposing(false);
      void refresh();
    },
  });
  const remove = useMutation({
    mutationFn: deleteCoordinatorNote,
    onSuccess: () => void refresh(),
  });
  const trimmed = draft.trim();

  return {
    query: notes,
    notes: notes.data ?? [],
    composing,
    openComposer: () => {
      add.reset();
      setComposing(true);
    },
    closeComposer: () => setComposing(false),
    draft,
    setDraft: (value: string) => setDraft(value.slice(0, MAX_COORDINATOR_NOTE)),
    canSave: trimmed.length > 0 && !add.isPending,
    save: () => {
      if (trimmed) add.mutate(trimmed);
    },
    saving: add.isPending,
    remove: (id: string) => remove.mutate(id),
    error: add.error ?? remove.error,
  };
}

export type CoordinatorNotes = ReturnType<typeof useCoordinatorNotes>;
