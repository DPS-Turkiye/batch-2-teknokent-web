"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { coordinatorProgramQueryKey } from "@/hooks/use-coordinator-program";
import { COORDINATOR_PROGRAMS_QUERY_KEY } from "@/hooks/use-coordinator-programs";
import { ToastTone } from "@/interfaces/toast";
import {
  alignProgramDates,
  getProgramWeekPlan,
  saveProgramWeekPlan,
} from "@/lib/client/program-weeks";
import { newRowKey } from "@/lib/keyed-list";
import {
  MAX_PLAN_WEEKS,
  nextFreeWeek,
  programTotalWeeks,
  weekDaysOf,
  weekDraftOf,
  weekInputOf,
  weekPlanProblem,
  type WeekDraft,
} from "@/lib/program-week";
import { errorMessage, formatCalendarDay } from "@/lib/utils";
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
  const locale = useLocale();
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
  const dateCheck = query.data?.dateCheck ?? null;

  const save = useMutation({
    mutationFn: (next: WeekDraft[]) =>
      // The editor changes weeks only; the special days go back as they were saved. Saving waits for the plan to
      // load (see `canEdit`), so this never sends an empty list in place of days it has not read yet.
      saveProgramWeekPlan(
        programId,
        next.map(weekInputOf),
        query.data?.specialDays ?? [],
      ),
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

  const align = useMutation({
    mutationFn: () => alignProgramDates(programId),
    onSuccess: async (saved) => {
      client.setQueryData(programWeekPlanQueryKey(programId), saved);
      // The program's own dates changed: its detail and the program list's week counter, not the plan just set.
      await Promise.all([
        client.invalidateQueries({
          queryKey: coordinatorProgramQueryKey(programId),
          exact: true,
        }),
        client.invalidateQueries({ queryKey: COORDINATOR_PROGRAMS_QUERY_KEY }),
      ]);
      showToast({ message: t("datesAligned"), tone: ToastTone.Success });
    },
    onError: (failure) =>
      showToast({
        message: errorMessage(failure, t("alignFailed")),
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
    specialDays: query.data?.specialDays ?? [],
    dateCheck,
    /** Why the program's dates and the syllabus's differ, for the warning above the plan. */
    dateCheckMessage: dateCheck
      ? t("datesMismatch", {
          start: formatCalendarDay(dateCheck.syllabusStart, locale),
          end: formatCalendarDay(dateCheck.syllabusEnd, locale),
          programStart: program.startDate
            ? formatCalendarDay(program.startDate, locale)
            : "–",
          programEnd: program.endDate
            ? formatCalendarDay(program.endDate, locale)
            : "–",
        })
      : null,
    alignDates: () => align.mutate(),
    isAligning: align.isPending,
    daysOf: (number: number) =>
      weekDaysOf(weeks, number, program.startDate, program.endDate),
    isLoading: query.isLoading,
    loadError: query.error,
    dirty: draft !== null,
    problem,
    isSaving: save.isPending,
    canAdd:
      query.data !== undefined && nextFreeWeek(weeks, totalWeeks) !== null,
    /** The highest week number a row may take: any for a week with its own dates, else the program's last. */
    maxWeekOf: (week: WeekDraft) =>
      week.startDate ? MAX_PLAN_WEEKS : (totalWeeks ?? undefined),
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
            startDate: null,
            endDate: null,
            sessions: [],
          },
        ].toSorted((left, right) => left.week - right.week),
      );
    },
    discard: () => {
      setDraft(null);
      setProblem(null);
    },
    save: () => {
      if (!query.data) return;
      const reason = weekPlanProblem(weeks, totalWeeks);
      if (reason) {
        setProblem(t(`problems.${reason}`, { total: totalWeeks ?? 0 }));
        return;
      }
      save.mutate(weeks);
    },
  };
}
