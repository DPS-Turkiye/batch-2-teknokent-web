"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { useAiFeatureRefusal, useAiFeatures } from "@/hooks/use-ai-features";
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
  dayRangeLabel,
  programWeekDays,
  weekDraftOf,
  weekPlanProblem,
  type WeekDraft,
} from "@/lib/program-week";
import { errorMessage, formatLongDate } from "@/lib/utils";
import {
  isStalePlanError,
  keepsEveryWeek,
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
  const locale = useLocale();
  const canReadFile = useAiFeatures().syllabus;
  const refused = useAiFeatureRefusal();
  const cache = useProgramCache(programId);
  const client = useQueryClient();
  const { showToast } = useToast();
  const [review, setReview] = useState<Review | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  // The file just uploaded, so a read that failed after the upload can be tried again on it.
  const [uploadedId, setUploadedId] = useState<string | null>(null);
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
    onError: (failure) => {
      refused(failure);
      fail(t("readFailed"))(failure);
    },
  });

  const upload = useMutation({
    mutationFn: (chosen: File) =>
      uploadDocument(chosen, DocumentKind.WeeklyProgram),
    onSuccess: (stored) => {
      setUploadedId(stored.id);
      read.mutate(stored.id);
    },
    onError: fail(t("uploadFailed")),
  });

  const save = useMutation({
    mutationFn: (input: SaveWeeklyProgramInput) =>
      saveWeeklyProgram(programId, input),
    onSuccess: (saved) => {
      setUploadedId(null);
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

  /** Every edit works on the latest review, so two edits in one tick both land. */
  const edit = (next: (current: Review) => Partial<Review>) => {
    setProblem(null);
    setReview((current) => (current ? { ...current, ...next(current) } : null));
  };

  const existing = review?.proposal.existing ?? null;
  const keptThrough = existing
    ? lastKeptWeek(existing, review?.keepPast ?? false)
    : null;
  const daysOf = (week: number) =>
    programWeekDays(detail.program.startDate, detail.program.endDate, week);
  const rereadId =
    uploadedId ?? (file?.kind === DocumentKind.WeeklyProgram ? file.id : null);
  const reading = upload.isPending || read.isPending;

  return {
    file,
    canReadFile,
    needsDates: !hasDates,
    reading,
    /** Reading, saving or reviewing a file, or no program dates yet: the file row waits. */
    busy: reading || save.isPending || review !== null || !hasDates,
    /** The line under the file name. */
    fileHint: !canReadFile
      ? t("manualHint")
      : reading
        ? t("reading")
        : !hasDates
          ? t("needsDates")
          : file
            ? file.kind === DocumentKind.Syllabus
              ? t("oldSyllabus")
              : t("uploaded", { date: formatLongDate(file.uploadedAt, locale) })
            : t("noFileHint"),
    chooseFile: (chosen: File) => {
      if (!canReadFile) return;
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
    canReread: canReadFile && rereadId !== null && hasDates,
    reread: () => {
      if (canReadFile && rereadId) read.mutate(rereadId);
    },

    reviewing: review !== null,
    proposal: review?.proposal ?? null,
    weeks: review?.weeks ?? [],
    phases: review?.phases ?? [],
    keepPast: review?.keepPast ?? false,
    lastKeptWeek: keptThrough,
    keepsEveryWeek: review
      ? keepsEveryWeek(keptThrough, review.proposal.totalWeeks)
      : false,
    mustConfirm: existing ? replacesExistingPlan(existing) : false,
    confirmed: review?.confirmed ?? false,
    problem,
    daysOf,
    /** From the first day of the phase's first week to the last day of its last week. */
    /** "Hafta 1–3 · 27 Eki – 16 Kas" */
    phaseRangeLabel: (phase: WeeklyProgramPhaseInput) => {
      const first = daysOf(phase.firstWeek);
      const last = daysOf(phase.lastWeek);
      const dates =
        (first && last && dayRangeLabel(first.start, last.end, locale)) ?? "";
      return phase.firstWeek === phase.lastWeek
        ? t("phaseRangeOne", { week: phase.firstWeek, dates })
        : t("phaseRange", {
            first: phase.firstWeek,
            last: phase.lastWeek,
            dates,
          });
    },
    /** The phase picker's label; an unnamed phase goes by its number. */
    phaseOptionLabel: (phase: WeeklyProgramPhaseInput, index: number) =>
      phase.name.trim() || t("unnamedPhase", { n: index + 1 }),
    phaseIndexOf: (week: number) =>
      phaseIndexOfWeek(review?.phases ?? [], week),
    setKeepPast: (keepPast: boolean) => edit(() => ({ keepPast })),
    setConfirmed: (confirmed: boolean) => edit(() => ({ confirmed })),
    updateWeek: (index: number, patch: Partial<WeekDraft>) =>
      edit((current) => ({
        weeks: current.weeks.map((week, at) =>
          at === index ? { ...week, ...patch } : week,
        ),
      })),
    removeWeek: (index: number) =>
      edit((current) => ({
        weeks: current.weeks.filter((_, at) => at !== index),
      })),
    renamePhase: (index: number, name: string) =>
      edit((current) => ({
        phases: current.phases.map((phase, at) =>
          at === index ? { ...phase, name } : phase,
        ),
      })),
    /** An emptied output means the phase has none. */
    setPhaseOutput: (index: number, output: string) =>
      edit((current) => ({
        phases: current.phases.map((phase, at) =>
          at === index ? { ...phase, expectedOutput: output || null } : phase,
        ),
      })),
    /** `target` is a phase's position, or NO_PHASE, which leaves the phases as they are. */
    moveWeek: (week: number, target: number) =>
      edit((current) => ({
        phases: moveWeekToPhase(current.phases, week, target),
      })),
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
