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
  phaseRemoval,
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
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);

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
      setConfirmingRemoval(false);
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
  const removal = before ? phaseRemoval(statusOf(before)) : null;
  const canRemove = removal?.allowed ?? false;
  // A phase that finishes while the question is open (past midnight) can no longer be removed.
  const asking = confirmingRemoval && canRemove;
  // By key, not position, so a list refreshed while the drawer is open cannot lose a different phase.
  const remove = (phase: PhaseDraft) =>
    commit(listed.filter((saved) => saved.key !== phase.key));
  const open = (target: Editing) => {
    setEditError(null);
    setConfirmingRemoval(false);
    setEditing(target);
  };

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
      const phase = listed[index];
      if (!phase) return;
      open({ index, draft: { ...phase } });
    },
    openNew: () => open({ index: null, draft: emptyPhase() }),
    close: () => {
      setConfirmingRemoval(false);
      setEditing(null);
    },
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
    /** Only a saved phase that has not finished can be removed. */
    canRemove,
    /** The drawer is asking whether to remove the running phase. */
    confirmingRemoval: asking,
    /** A running phase only asks here; confirmRemoval then deletes it. */
    removeEditing: () => {
      if (!editing || !canRemove) return;
      if (removal?.needsConfirmation) {
        setConfirmingRemoval(true);
        return;
      }
      remove(editing.draft);
    },
    confirmRemoval: () => {
      if (editing && asking) remove(editing.draft);
    },
    cancelRemoval: () => setConfirmingRemoval(false),
    saving: save.isPending,
  };
}
