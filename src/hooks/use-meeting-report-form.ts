"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  PEER_REPORTS_QUERY_KEY,
  peerMeetingReportQueryKey,
} from "@/hooks/peer-report-queries";
import type {
  PeerMeetingReport,
  PeerMeetingTopic,
  PeerMentorSkill,
} from "@/interfaces/peer-reports";
import { ToastTone } from "@/interfaces/toast";
import {
  getPeerMeetingReport,
  savePeerMeetingReport,
  setPeerReportActionDone,
  submitPeerMeetingReport,
} from "@/lib/client/peer-reports";
import {
  MEETING_REPORT_ACTIONS_MAX,
  meetingReportForm,
  meetingReportInput,
  missingMeetingReportSections,
  newActionRow,
  toggled,
} from "@/lib/peer-meeting-report";
import { dailyReportHref } from "@/lib/peer-reports";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";
import type {
  MeetingReportActionRow,
  MeetingReportForm,
} from "@/types/peer-meeting-report";

/**
 * "Görüşme Raporu" (Figma 220:2): the report of one held meeting, its form state, saving a draft, sending it, and
 * ticking action steps off once it is sent. The form starts from the saved report (or the calendar's prefill) and
 * keeps the mentor's edits until the next save.
 */
export function useMeetingReportForm(meetingId: string) {
  const t = useTranslations("iaIskurReports.meeting");
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const key = peerMeetingReportQueryKey(meetingId);
  const query = useQuery({
    queryKey: key,
    queryFn: () => getPeerMeetingReport(meetingId),
  });
  const report = query.data;
  // Edits belong to the report version they were made on; a newer save starts from the server's copy again.
  const version = report ? (report.updatedAt ?? "new") : null;
  const [edits, setEdits] = useState<{
    version: string;
    form: MeetingReportForm;
  } | null>(null);
  const [showMissing, setShowMissing] = useState(false);

  const form: MeetingReportForm | null = report
    ? edits !== null && edits.version === version
      ? edits.form
      : meetingReportForm(report)
    : null;
  const missing = form ? missingMeetingReportSections(form) : [];

  function update(patch: Partial<MeetingReportForm>) {
    if (!form || version === null) return;
    setEdits({ version, form: { ...form, ...patch } });
  }

  function stored(saved: PeerMeetingReport) {
    queryClient.setQueryData(key, saved);
    setEdits(null);
  }

  const save = useMutation({
    mutationFn: (draft: MeetingReportForm) =>
      savePeerMeetingReport(meetingId, meetingReportInput(draft)),
    onSuccess: (saved) => {
      stored(saved);
      showToast({ message: t("saved"), tone: ToastTone.Success });
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, t("saveFailed")),
        tone: ToastTone.Error,
      }),
  });

  const submit = useMutation({
    mutationFn: async (draft: MeetingReportForm) => {
      await savePeerMeetingReport(meetingId, meetingReportInput(draft));
      return submitPeerMeetingReport(meetingId);
    },
    onSuccess: (sent) => {
      stored(sent);
      void queryClient.invalidateQueries({ queryKey: PEER_REPORTS_QUERY_KEY });
      showToast({ message: t("sent"), tone: ToastTone.Success });
      router.push(dailyReportHref(sent.scheduledAt));
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, t("sendFailed")),
        tone: ToastTone.Error,
      }),
  });

  const tickAction = useMutation({
    mutationFn: ({ actionId, done }: { actionId: string; done: boolean }) =>
      setPeerReportActionDone(meetingId, actionId, done),
    onSuccess: (saved) => queryClient.setQueryData(key, saved),
    onError: (error) =>
      showToast({
        message: errorMessage(error, t("saveFailed")),
        tone: ToastTone.Error,
      }),
  });

  return {
    query,
    report,
    form,
    editable: report?.editable ?? false,
    missing,
    showMissing,
    completed: form ? 6 - missing.length : 0,
    busy: save.isPending || submit.isPending,
    update,
    toggleTopic: (topic: PeerMeetingTopic) =>
      form && update({ topics: toggled(form.topics, topic) }),
    toggleSkill: (skill: PeerMentorSkill) =>
      form && update({ skills: toggled(form.skills, skill) }),
    canAddAction:
      form !== null && form.actions.length < MEETING_REPORT_ACTIONS_MAX,
    addAction: () =>
      form &&
      form.actions.length < MEETING_REPORT_ACTIONS_MAX &&
      update({ actions: [...form.actions, newActionRow()] }),
    updateAction: (
      rowKey: string,
      patch: Partial<Omit<MeetingReportActionRow, "key">>,
    ) =>
      form &&
      update({
        actions: form.actions.map((action) =>
          action.key === rowKey ? { ...action, ...patch } : action,
        ),
      }),
    removeAction: (rowKey: string) =>
      form &&
      update({
        actions: form.actions.filter((action) => action.key !== rowKey),
      }),
    saveDraft: () => {
      if (form) save.mutate(form);
    },
    send: () => {
      if (!form) return;
      if (missing.length > 0) {
        setShowMissing(true);
        showToast({ message: t("missingSections"), tone: ToastTone.Error });
        return;
      }
      submit.mutate(form);
    },
    /** A draft row can be ticked while editing; a sent report's saved steps are ticked on the server. */
    canTickAction: (row: MeetingReportActionRow) =>
      (report?.editable ?? false) || row.id !== null,
    /** A sent report's action steps can still be ticked off; the weekly summary counts them. */
    toggleActionDone: (row: MeetingReportActionRow, done: boolean) => {
      if (report?.editable) {
        if (form) {
          update({
            actions: form.actions.map((action) =>
              action.key === row.key ? { ...action, done } : action,
            ),
          });
        }
      } else if (row.id !== null) {
        tickAction.mutate({ actionId: row.id, done });
      }
    },
  };
}
