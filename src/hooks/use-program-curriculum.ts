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
  curriculumError,
  dayShift,
  phaseDateLocks,
  phaseStatus,
  PhaseStatus,
  proposedPhases,
  reorderPhases,
  SyllabusFileProblem,
  syllabusFileProblem,
  type WizardPhase,
} from "@/lib/program-phases";
import { errorMessage } from "@/lib/utils";

type Editing = { index: number | null; draft: WizardPhase };
type Review = { documentId: string; phases: WizardPhase[] };

/**
 * Müfredat & fazlar: each phase is edited in its own drawer and saved on its own. Phases are
 * replaced as a whole, so every save sends the full list with the one change applied.
 * While phases read from the file are under review, edits stay in the review until it is saved,
 * and it cannot be saved while a phase from the file has no dates (as in the launch wizard).
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
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const listed: WizardPhase[] =
    review?.phases ?? saved.map((phase) => ({ ...phase, fromFile: false }));

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
      startReview(null);
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
      startReview({ documentId, phases: proposedPhases(result.phases) }),
    onError: fail(t("readFailed")),
  });

  const upload = useMutation({
    mutationFn: (file: File) => uploadDocument(file, DocumentKind.Syllabus),
    onSuccess: (stored) => extract.mutate(stored.id),
    onError: fail(t("uploadFailed")),
  });

  const startReview = (next: Review | null) => {
    setReview(next);
    setReviewError(null);
  };
  /** Applies a list change to the review, or saves it when nothing is under review. */
  const commit = (phases: WizardPhase[]) => {
    if (!review) {
      save.mutate({ phases, documentId: null });
      return;
    }
    startReview({ ...review, phases });
    setEditing(null);
  };

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
    syllabus: detail.syllabus,
    reviewing: review !== null,
    reviewError,
    confirmReview: () => {
      if (!review) return;
      const problem = curriculumError(review.phases);
      setReviewError(problem);
      if (problem) return;
      save.mutate({ phases: review.phases, documentId: review.documentId });
    },
    discardReview: () => startReview(null),
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
      editing && before && !review
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
      setEditing({ index, draft: { ...listed[index] } });
    },
    openNew: () => {
      setEditError(null);
      setEditing({ index: null, draft: { ...emptyPhase(), fromFile: false } });
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
