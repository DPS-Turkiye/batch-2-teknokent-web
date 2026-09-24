"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useCoordinatorPrograms } from "@/hooks/use-coordinator-programs";
import { getCoordinatorCalendar } from "@/lib/client/coordinator-calendar";
import { createCoordinatorProgramEvent } from "@/lib/client/coordinator-programs";
import {
  CalendarView,
  emptyEventDraft,
  type EventDraft,
  eventDraftError,
  eventInput,
  rangeLabel,
  shiftAnchor,
  viewDays,
  viewRange,
} from "@/lib/coordinator-calendar";

export const COORDINATOR_CALENDAR_QUERY_KEY = ["coordinator-calendar"] as const;

/** The coordinator's Takvim: the visible range, program filter, the open item and the add-event form. */
export function useCoordinatorCalendar(today = new Date()) {
  const queryClient = useQueryClient();
  const programs = useCoordinatorPrograms();
  const [view, setViewState] = useState(CalendarView.Week);
  const [anchor, setAnchor] = useState(today);
  const [programId, setProgramId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);

  const range = viewRange(view, anchor);
  const query = useQuery({
    queryKey: [...COORDINATOR_CALENDAR_QUERY_KEY, range, programId],
    queryFn: () => getCoordinatorCalendar({ ...range, programId }),
  });
  const programOptions = programs.data ?? [];

  const createEvent = useMutation({
    mutationFn: (input: EventDraft) =>
      createCoordinatorProgramEvent(input.programId, eventInput(input)),
    onSuccess: () => {
      setDraft(null);
      void queryClient.invalidateQueries({
        queryKey: COORDINATOR_CALENDAR_QUERY_KEY,
      });
    },
  });

  return {
    query,
    programOptions,
    view,
    setView: (next: CalendarView) => {
      setViewState(next);
      setSelectedId(null);
    },
    days: viewDays(view, anchor),
    label: rangeLabel(view, anchor),
    previous: () => {
      setAnchor(shiftAnchor(view, anchor, -1));
      setSelectedId(null);
    },
    next: () => {
      setAnchor(shiftAnchor(view, anchor, 1));
      setSelectedId(null);
    },
    goToToday: () => setAnchor(today),
    programId,
    setProgramId,
    selectedId,
    select: (id: string | null) =>
      setSelectedId((current) => (current === id ? null : id)),
    draft,
    draftError: draftError ?? createEvent.error?.message ?? null,
    saving: createEvent.isPending,
    openEventForm: () => {
      setDraftError(null);
      createEvent.reset();
      setDraft(
        emptyEventDraft(programId ?? programOptions[0]?.id ?? "", anchor),
      );
    },
    closeEventForm: () => setDraft(null),
    updateDraft: (patch: Partial<EventDraft>) =>
      setDraft((current) => (current ? { ...current, ...patch } : current)),
    saveDraft: () => {
      if (!draft) return;
      const error = eventDraftError(draft);
      setDraftError(error);
      if (!error) createEvent.mutate(draft);
    },
  };
}
