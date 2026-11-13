"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { ToastTone } from "@/interfaces/toast";
import {
  getProgramWeekPlan,
  saveProgramWeekPlan,
} from "@/lib/client/program-weeks";
import { newRowKey } from "@/lib/keyed-list";
import {
  nextFreeWeek,
  programTotalWeeks,
  programWeekDays,
  weekDraftOf,
  weekInputOf,
  weekPlanProblem,
  type WeekDraft,
} from "@/lib/program-week";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

export const programWeekPlanQueryKey = (programId: string) =>
  ["coordinator-program", programId, "weeks"] as const;

/**
 * Haftalık program & fazlar › Haftalık plan. Shows the saved weeks; any edit turns them into a draft that is
 * saved or discarded as a whole. Weeks read from a weekly program file are saved by useWeeklyProgramImport.
 */
export function useProgramWeekPlan(
  programId: string,
  program: { startDate: string | null; endDate: string | null },
) {
  const t = useTranslations("programWeekPlan");
  const { showToast } = useToast();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: programWeekPlanQueryKey(programId),
    queryFn: () => getProgramWeekPlan(programId),
  });
  const [draft, setDraft] = useState<WeekDraft[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const totalWeeks =
    query.data?.totalWeeks ??
    programTotalWeeks(program.startDate, program.endDate);
  // Built once per answer, so the rows keep their keys until the coordinator edits them.
  const loaded = useMemo(
    () => (query.data?.weeks ?? []).map(weekDraftOf),
    [query.data?.weeks],
  );
  const weeks = draft ?? loaded;

  const save = useMutation({
    mutationFn: (next: WeekDraft[]) =>
      saveProgramWeekPlan(programId, next.map(weekInputOf)),
    onSuccess: (saved) => {
      client.setQueryData(programWeekPlanQueryKey(programId), saved);
      setDraft(null);
      showToast({ message: t("saved"), tone: ToastTone.Success });
    },
    onError: (failure) =>
      showToast({
        message: errorMessage(failure, t("saveFailed")),
        tone: ToastTone.Error,
      }),
  });

  const change = (next: WeekDraft[]) => {
    setProblem(null);
    setDraft(next);
  };

  return {
    weeks,
    totalWeeks,
    daysOf: (week: number) =>
      programWeekDays(program.startDate, program.endDate, week),
    isLoading: query.isLoading,
    loadError: query.error,
    dirty: draft !== null,
    problem,
    isSaving: save.isPending,
    canAdd: nextFreeWeek(weeks, totalWeeks) !== null,
    update: (index: number, patch: Partial<WeekDraft>) =>
      change(
        weeks.map((week, at) => (at === index ? { ...week, ...patch } : week)),
      ),
    remove: (index: number) => change(weeks.filter((_, at) => at !== index)),
    add: () => {
      const week = nextFreeWeek(weeks, totalWeeks);
      if (week === null) return;
      change(
        [
          ...weeks,
          {
            key: newRowKey(),
            week,
            title: "",
            topics: "",
            activities: "",
            deliverables: "",
            inferred: false,
          },
        ].toSorted((left, right) => left.week - right.week),
      );
    },
    discard: () => {
      setDraft(null);
      setProblem(null);
    },
    save: () => {
      const reason = weekPlanProblem(weeks, totalWeeks);
      if (reason) {
        setProblem(t(`problems.${reason}`, { total: totalWeeks ?? 0 }));
        return;
      }
      save.mutate(weeks);
    },
  };
}
