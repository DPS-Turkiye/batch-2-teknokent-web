"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useProgramCache } from "@/hooks/use-coordinator-program";
import type { CoordinatorProgramDetail } from "@/interfaces/coordinator-program";
import { ToastTone } from "@/interfaces/toast";
import { replaceCoordinatorProgramPhases } from "@/lib/client/coordinator-programs";
import { isoDay } from "@/lib/coordinator-calendar";
import {
  emptyPhase,
  MAX_PHASES,
  phaseDraftError,
  phasesInput,
  savedPhases,
  type PhaseDraft,
} from "@/lib/coordinator-program-detail";
import {
  dayShift,
  phaseDateLocks,
  phaseStatus,
  PhaseStatus,
  reorderPhases,
} from "@/lib/program-phases";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

type Editing = { index: number | null; draft: PhaseDraft };

/**
 * Haftalık program & fazlar: each phase is edited in its own drawer and saved on its own. Phases are
 * replaced as a whole, so every save sends the full list with the one change applied. Phases read from a
 * weekly program file are reviewed and saved by useWeeklyProgramImport.
 */
export function useProgramCurriculum(
  programId: string,
  detail: CoordinatorProgramDetail,
) {
  const t = useTranslations("programCurriculum");
  const cache = useProgramCache(programId);
  const { showToast } = useToast();
  const today = isoDay(new Date());
  const listed = savedPhases(detail);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const fail = (fallback: string) => (failure: Error) =>
    showToast({
      message: errorMessage(failure, fallback),
      tone: ToastTone.Error,
    });

  const save = useMutation({
    mutationFn: (phases: PhaseDraft[]) =>
      replaceCoordinatorProgramPhases(programId, phasesInput(phases), null),
    onSuccess: (next) => {
      cache.put(next);
      setEditing(null);
      showToast({ message: t("saved"), tone: ToastTone.Success });
    },
    onError: fail(t("saveFailed")),
  });

  const commit = (phases: PhaseDraft[]) => save.mutate(phases);

  const statusOf = (phase: PhaseDraft) => phaseStatus(phase, today);
  const before = editing?.index != null ? listed[editing.index] : null;
  const status = editing
    ? before
      ? statusOf(before)
      : PhaseStatus.Planned
    : null;
  const next =
    editing?.index != null ? listed[editing.index + 1] : listed.at(-1);

  return {
    today,
    phases: listed,
    statusOf,
    canAdd: listed.length < MAX_PHASES,
    move: (from: number, to: number) => {
      const moved = reorderPhases(listed, from, to);
      if (moved !== listed) commit(moved);
    },

    editing: editing?.draft ?? null,
    editingIndex: editing?.index ?? null,
    editingStatus: status,
    locks: status ? phaseDateLocks(status) : null,
    /** What the drawer's "Bu değişikliğin etkisi" box lists; null until a date changes. */
    effects:
      editing && before
        ? {
            startShift:
              before.startDate &&
              editing.draft.startDate &&
              before.startDate !== editing.draft.startDate
                ? {
                    from: before.startDate,
                    to: editing.draft.startDate,
                    days: dayShift(before.startDate, editing.draft.startDate),
                  }
                : null,
            endShift:
              before.endDate &&
              editing.draft.endDate &&
              before.endDate !== editing.draft.endDate
                ? {
                    from: before.endDate,
                    to: editing.draft.endDate,
                    days: dayShift(before.endDate, editing.draft.endDate),
                  }
                : null,
            nextGap:
              next?.startDate && editing.draft.endDate
                ? {
                    name: next.name,
                    start: next.startDate,
                    days: dayShift(editing.draft.endDate, next.startDate),
                  }
                : null,
          }
        : null,
    teamCount: detail.program.teamCount,
    editError,
    openPhase: (index: number) => {
      setEditError(null);
      const phase = listed[index];
      if (!phase) return;
      setEditing({ index, draft: { ...phase } });
    },
    openNew: () => {
      setEditError(null);
      setEditing({ index: null, draft: emptyPhase() });
    },
    close: () => setEditing(null),
    update: (patch: Partial<PhaseDraft>) => {
      setEditError(null);
      setEditing((current) =>
        current ? { ...current, draft: { ...current.draft, ...patch } } : null,
      );
    },
    saveEditing: () => {
      if (!editing) return;
      const problem = phaseDraftError(editing.draft);
      setEditError(problem);
      if (problem) return;
      commit(
        editing.index === null
          ? [...listed, editing.draft]
          : listed.map((phase, index) =>
              index === editing.index ? editing.draft : phase,
            ),
      );
    },
    removeEditing: () => {
      if (editing?.index == null) return;
      commit(listed.filter((_, index) => index !== editing.index));
    },
    saving: save.isPending,
  };
}
