"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useProgramCache } from "@/hooks/use-coordinator-program";
import { programWeekPlanQueryKey } from "@/hooks/use-program-week-plan";
import type { CoordinatorProgramDetail } from "@/interfaces/coordinator-program";
import { DocumentKind } from "@/interfaces/startup-document";
import { ToastTone } from "@/interfaces/toast";
import type {
  SaveWeeklyProgramInput,
  WeeklyProgramPhaseInput,
  WeeklyProgramProposal,
} from "@/interfaces/weekly-program";
import { uploadDocument } from "@/lib/client/documents";
import {
  readWeeklyProgram,
  saveWeeklyProgram,
} from "@/lib/client/weekly-program";
import { ProgramFileProblem, programFileProblem } from "@/lib/program-phases";
import {
  programWeekDays,
  weekDraftOf,
  weekPlanProblem,
  type WeekDraft,
} from "@/lib/program-week";
import { errorMessage } from "@/lib/utils";
import {
  isStalePlanError,
  lastKeptWeek,
  moveWeekToPhase,
  phaseIndexOfWeek,
  phaseRangeDraftsOf,
  phaseRangeProblem,
  replacesExistingPlan,
  weeklyProgramSaveInput,
  type PhaseRangeDraft,
} from "@/lib/weekly-program";
import { useToast } from "@/stores/toast-store";

type Review = {
  documentId: string;
  proposal: WeeklyProgramProposal;
  weeks: WeekDraft[];
  phases: PhaseRangeDraft[];
  keepPast: boolean;
  confirmed: boolean;
};

function reviewOf(documentId: string, proposal: WeeklyProgramProposal): Review {
  return {
    documentId,
    proposal,
    weeks: proposal.weeks.map(weekDraftOf),
    phases: phaseRangeDraftsOf(proposal.phases),
    // A running program keeps what already happened unless the coordinator says otherwise.
    keepPast: proposal.existing.currentWeek !== null,
    confirmed: false,
  };
}

/**
 * Haftalık program & fazlar: the coordinator uploads the program's weekly program PDF, the backend reads it into
 * weeks and the phases they form, and the coordinator reviews both and saves them in one step. Nothing is saved
 * by the read; a plan the program already has is only replaced after the coordinator confirms it.
 */
export function useWeeklyProgramImport(
  programId: string,
  detail: CoordinatorProgramDetail,
) {
  const t = useTranslations("weeklyProgram");
  const cache = useProgramCache(programId);
  const client = useQueryClient();
  const { showToast } = useToast();
  const [review, setReview] = useState<Review | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const file = detail.syllabus;
  const hasDates = Boolean(detail.program.startDate && detail.program.endDate);

  const fail = (fallback: string) => (failure: Error) =>
    showToast({
      message: errorMessage(failure, fallback),
      tone: ToastTone.Error,
    });

  const read = useMutation({
    mutationFn: (documentId: string) =>
      readWeeklyProgram(programId, documentId),
    onSuccess: (proposal, documentId) => {
      setProblem(null);
      setReview(reviewOf(documentId, proposal));
    },
    onError: fail(t("readFailed")),
  });

  const upload = useMutation({
    mutationFn: (chosen: File) =>
      uploadDocument(chosen, DocumentKind.WeeklyProgram),
    onSuccess: (stored) => read.mutate(stored.id),
    onError: fail(t("uploadFailed")),
  });

  const save = useMutation({
    mutationFn: (input: SaveWeeklyProgramInput) =>
      saveWeeklyProgram(programId, input),
    onSuccess: (saved) => {
      cache.put(saved.program);
      client.setQueryData(programWeekPlanQueryKey(programId), saved.plan);
      setReview(null);
      showToast({ message: t("saved"), tone: ToastTone.Success });
    },
    onError: (failure) =>
      showToast({
        message: isStalePlanError(failure)
          ? t("planChanged")
          : errorMessage(failure, t("saveFailed")),
        tone: ToastTone.Error,
      }),
  });

  const change = (patch: Partial<Review>) => {
    setProblem(null);
    setReview((current) => (current ? { ...current, ...patch } : null));
  };

  const existing = review?.proposal.existing ?? null;
  const daysOf = (week: number) =>
    programWeekDays(detail.program.startDate, detail.program.endDate, week);

  return {
    file,
    /** The program's file is an older syllabus: it stays readable, but is not read again. */
    oldSyllabus: file?.kind === DocumentKind.Syllabus,
    needsDates: !hasDates,
    reading: upload.isPending || read.isPending,
    chooseFile: (chosen: File) => {
      const fileProblem = programFileProblem(chosen);
      if (fileProblem) {
        showToast({
          message:
            fileProblem === ProgramFileProblem.NotPdf
              ? t("pdfOnly")
              : t("tooLarge"),
          tone: ToastTone.Error,
        });
        return;
      }
      upload.mutate(chosen);
    },
    canReread: file?.kind === DocumentKind.WeeklyProgram && hasDates,
    reread: () => {
      if (file?.kind === DocumentKind.WeeklyProgram) read.mutate(file.id);
    },

    reviewing: review !== null,
    proposal: review?.proposal ?? null,
    weeks: review?.weeks ?? [],
    phases: review?.phases ?? [],
    keepPast: review?.keepPast ?? false,
    lastKeptWeek: existing
      ? lastKeptWeek(existing, review?.keepPast ?? false)
      : null,
    mustConfirm: existing ? replacesExistingPlan(existing) : false,
    confirmed: review?.confirmed ?? false,
    problem,
    daysOf,
    /** From the first day of the phase's first week to the last day of its last week. */
    phaseDays: (phase: WeeklyProgramPhaseInput) => {
      const first = daysOf(phase.firstWeek);
      const last = daysOf(phase.lastWeek);
      return first && last ? { start: first.start, end: last.end } : null;
    },
    phaseIndexOf: (week: number) =>
      phaseIndexOfWeek(review?.phases ?? [], week),
    setKeepPast: (keepPast: boolean) => change({ keepPast }),
    setConfirmed: (confirmed: boolean) => change({ confirmed }),
    updateWeek: (index: number, patch: Partial<WeekDraft>) => {
      if (!review) return;
      change({
        weeks: review.weeks.map((week, at) =>
          at === index ? { ...week, ...patch } : week,
        ),
      });
    },
    removeWeek: (index: number) => {
      if (!review) return;
      change({ weeks: review.weeks.filter((_, at) => at !== index) });
    },
    updatePhase: (
      index: number,
      patch: Partial<Pick<WeeklyProgramPhaseInput, "name" | "expectedOutput">>,
    ) => {
      if (!review) return;
      change({
        phases: review.phases.map((phase, at) =>
          at === index ? { ...phase, ...patch } : phase,
        ),
      });
    },
    moveWeek: (week: number, target: number) => {
      if (!review) return;
      change({ phases: moveWeekToPhase(review.phases, week, target) });
    },
    discard: () => {
      setProblem(null);
      setReview(null);
    },
    saving: save.isPending,
    save: () => {
      if (!review) return;
      const total = review.proposal.totalWeeks;
      const weekProblem = weekPlanProblem(review.weeks, total);
      const rangeProblem = phaseRangeProblem(review.phases, total);
      const reason = weekProblem
        ? t(`weekProblems.${weekProblem}`, { total })
        : rangeProblem
          ? t(`phaseProblems.${rangeProblem}`, { total })
          : review.weeks.length === 0
            ? t("noWeeks")
            : replacesExistingPlan(review.proposal.existing) &&
                !review.confirmed
              ? t("confirmFirst")
              : null;
      setProblem(reason);
      if (reason) return;
      save.mutate(
        weeklyProgramSaveInput({
          documentId: review.documentId,
          weeks: review.weeks,
          phases: review.phases,
          existing: review.proposal.existing,
          keepPast: review.keepPast,
        }),
      );
    },
  };
}
