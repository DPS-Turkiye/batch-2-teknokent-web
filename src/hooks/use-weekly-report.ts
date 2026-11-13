"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useMinuteClock } from "@/hooks/use-minute-clock";
import type { PeerWeeklyReport } from "@/interfaces/peer-reports";
import { ToastTone } from "@/interfaces/toast";
import {
  getPeerWeeklyReport,
  savePeerWeeklyReport,
  submitPeerWeeklyReport,
} from "@/lib/client/peer-reports";
import { peerReportBadge } from "@/lib/peer-reports";
import {
  isWeeklyLate,
  menteeFirstNames,
  reportToday,
  toWeeklyInput,
  WEEKLY_QUESTIONS,
  weeklyAnswers,
  weeklyChecklist,
  weeklyDayCards,
  weeklySkillBars,
  weeklyStatusNote,
  weeklySubmitBlock,
  weeklySubmitReason,
} from "@/lib/peer-weekly-report";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";
import type { WeeklyAnswers, WeeklyQuestion } from "@/types/peer-weekly-report";

/** Every report screen's queries start with this, so sending one level can refresh the others. */
export const PEER_REPORTS_QUERY_KEY = ["peer-reports"] as const;

export function peerWeeklyReportQueryKey(weekStart: string) {
  return [...PEER_REPORTS_QUERY_KEY, "weeks", weekStart] as const;
}

type WeekAnswers = { weekStart: string; answers: WeeklyAnswers };

function sameAnswers(a: WeeklyAnswers, b: WeeklyAnswers) {
  return WEEKLY_QUESTIONS.every((question) => a[question] === b[question]);
}

const NO_ANSWERS: WeeklyAnswers = {
  needsObserved: "",
  growth: "",
  nextWeekPlan: "",
};

/**
 * "Haftalık Özet" (Figma 221:521): the week computed by the backend, the three evaluation answers as typed, the
 * checklist and the send gate, saving a draft, sending (after saving unsaved answers) and the print preview.
 */
export function useWeeklyReport(weekStart: string) {
  const t = useTranslations("iaIskurReports.weekly");
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: peerWeeklyReportQueryKey(weekStart),
    queryFn: () => getPeerWeeklyReport(weekStart),
  });
  // Edits belong to the week they were typed in; another week starts from its own saved answers.
  const [edits, setEdits] = useState<WeekAnswers | null>(null);
  const [previewWeek, setPreviewWeek] = useState<string | null>(null);
  // The send window opens on Friday 18:00 and the deadline passes on Monday 23:59 while the screen may stay open.
  const now = useMinuteClock();

  const report = query.data;
  const typed = edits?.weekStart === weekStart ? edits.answers : null;
  const answers = typed ?? (report ? weeklyAnswers(report) : NO_ANSWERS);
  const block = report ? weeklySubmitBlock(report, answers, now) : null;

  /** Keeps what came back for the week that was sent, and drops that week's edits only if nothing was typed since. */
  const settle = (saved: PeerWeeklyReport, sent: WeekAnswers) => {
    queryClient.setQueryData(peerWeeklyReportQueryKey(sent.weekStart), saved);
    setEdits((current) =>
      current?.weekStart === sent.weekStart &&
      sameAnswers(current.answers, sent.answers)
        ? null
        : current,
    );
  };

  const save = useMutation({
    mutationFn: (sent: WeekAnswers) =>
      savePeerWeeklyReport(sent.weekStart, toWeeklyInput(sent.answers)),
    onSuccess: (saved, sent) => {
      settle(saved, sent);
      showToast({ message: t("saved"), tone: ToastTone.Success });
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, t("saveFailed")),
        tone: ToastTone.Error,
      }),
  });

  const submit = useMutation({
    mutationFn: async ({
      sent,
      unsaved,
    }: {
      sent: WeekAnswers;
      unsaved: boolean;
    }) => {
      if (unsaved) {
        await savePeerWeeklyReport(sent.weekStart, toWeeklyInput(sent.answers));
      }
      return submitPeerWeeklyReport(sent.weekStart);
    },
    onSuccess: (done, { sent }) => {
      settle(done, sent);
      // A sent week locks its days, so the daily views must re-read them.
      void queryClient.invalidateQueries({ queryKey: PEER_REPORTS_QUERY_KEY });
      showToast({ message: t("submitted"), tone: ToastTone.Success });
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, t("submitFailed")),
        tone: ToastTone.Error,
      }),
  });

  return {
    query,
    report,
    answers,
    setAnswer: (question: WeeklyQuestion, value: string) =>
      setEdits({ weekStart, answers: { ...answers, [question]: value } }),
    editable: report?.editable ?? false,
    badge: report ? peerReportBadge(report.status) : null,
    statusNote: report ? weeklyStatusNote(report, now) : null,
    checklist: report ? weeklyChecklist(report, answers) : [],
    block,
    late: report ? isWeeklyLate(report, now) : false,
    days: report ? weeklyDayCards(report.days, reportToday(now)) : [],
    skillBars: report ? weeklySkillBars(report.summary) : [],
    menteeNames: report ? menteeFirstNames(report.summary) : [],
    blockReason: weeklySubmitReason(block),
    save: () => save.mutate({ weekStart, answers }),
    isSaving: save.isPending,
    submit: () => {
      if (!report || block !== null || submit.isPending || save.isPending)
        return;
      submit.mutate({
        sent: { weekStart, answers },
        unsaved: typed !== null || report.id === null,
      });
    },
    isSubmitting: submit.isPending,
    preview: {
      open: previewWeek === weekStart && report !== undefined,
      show: () => setPreviewWeek(weekStart),
      close: () => setPreviewWeek(null),
      print: () => window.print(),
    },
  };
}
