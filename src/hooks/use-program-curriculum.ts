"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useToast } from "@/components/providers/toast-provider";
import { useProgramCache } from "@/hooks/use-coordinator-program";
import type { CoordinatorProgramDetail } from "@/interfaces/coordinator-program";
import { DocumentKind } from "@/interfaces/startup-document";
import {
  extractSyllabusPhases,
  replaceCoordinatorProgramPhases,
} from "@/lib/client/coordinator-programs";
import { uploadDocument } from "@/lib/client/documents";
import { isoDay } from "@/lib/coordinator-calendar";
import {
  emptyPhase,
  MAX_PHASES,
  type PhaseDraft,
  phaseDraftError,
  phasesInput,
  savedPhases,
} from "@/lib/coordinator-program-detail";
import {
  dayShift,
  phaseDateLocks,
  phaseStatus,
  PhaseStatus,
  proposedPhases,
  reorderPhases,
  SyllabusFileProblem,
  syllabusFileProblem,
} from "@/lib/program-phases";
import { errorMessage } from "@/lib/utils";

type Editing = { index: number | null; draft: PhaseDraft };
type Review = { documentId: string; phases: PhaseDraft[] };

/**
 * Müfredat & fazlar: each phase is edited in its own drawer and saved on its own. Phases are
 * replaced as a whole, so every save sends the full list with the one change applied.
 */
export function useProgramCurriculum(
  programId: string,
  detail: CoordinatorProgramDetail,
) {
  const t = useTranslations("programCurriculum");
  const cache = useProgramCache(programId);
  const { showToast } = useToast();
  const today = isoDay(new Date());
  const saved = savedPhases(detail);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const fail = (fallback: string) => (failure: Error) =>
    showToast({ message: errorMessage(failure, fallback), tone: "error" });

  const save = useMutation({
    mutationFn: ({
      phases,
      documentId,
    }: {
      phases: PhaseDraft[];
      documentId: string | null;
    }) =>
      replaceCoordinatorProgramPhases(
        programId,
        phasesInput(phases),
        documentId,
      ),
    onSuccess: (next) => {
      cache.put(next);
      setEditing(null);
      setReview(null);
      showToast({ message: t("saved"), tone: "success" });
    },
    onError: fail(t("saveFailed")),
  });

  const extract = useMutation({
    mutationFn: (documentId: string) =>
      extractSyllabusPhases({
        documentId,
        startDate: detail.program.startDate,
        endDate: detail.program.endDate,
      }),
    onSuccess: (result, documentId) =>
      setReview({ documentId, phases: proposedPhases(result.phases) }),
    onError: fail(t("readFailed")),
  });

  const upload = useMutation({
    mutationFn: (file: File) => uploadDocument(file, DocumentKind.Syllabus),
    onSuccess: (stored) => extract.mutate(stored.id),
    onError: fail(t("uploadFailed")),
  });

  const statusOf = (phase: PhaseDraft) => phaseStatus(phase, today);
  const before = editing?.index != null ? saved[editing.index] : null;
  const status = editing
    ? before
      ? statusOf(before)
      : PhaseStatus.Planned
    : null;
  const next = editing?.index != null ? saved[editing.index + 1] : saved.at(-1);

  return {
    today,
    phases: review?.phases ?? saved,
    statusOf,
    syllabus: detail.syllabus,
    reviewing: review !== null,
    confirmReview: () =>
      review &&
      save.mutate({ phases: review.phases, documentId: review.documentId }),
    discardReview: () => setReview(null),
    readingFile: upload.isPending || extract.isPending,
    chooseFile: (file: File) => {
      const problem = syllabusFileProblem(file);
      if (problem) {
        showToast({
          message:
            problem === SyllabusFileProblem.NotPdf
              ? t("pdfOnly")
              : t("tooLarge"),
          tone: "error",
        });
        return;
      }
      upload.mutate(file);
    },
    reread: () => {
      if (detail.syllabus) extract.mutate(detail.syllabus.id);
    },
    canAdd: saved.length < MAX_PHASES,
    move: (from: number, to: number) => {
      const moved = reorderPhases(saved, from, to);
      if (moved !== saved) save.mutate({ phases: moved, documentId: null });
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
      setEditing({ index, draft: { ...saved[index] } });
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
      const phases =
        editing.index === null
          ? [...saved, editing.draft]
          : saved.map((phase, index) =>
              index === editing.index ? editing.draft : phase,
            );
      save.mutate({ phases, documentId: null });
    },
    removeEditing: () => {
      if (editing?.index == null) return;
      save.mutate({
        phases: saved.filter((_, index) => index !== editing.index),
        documentId: null,
      });
    },
    saving: save.isPending,
  };
}
