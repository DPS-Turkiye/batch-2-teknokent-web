"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  peerDailyReportQueryKey,
  refreshOtherReportViews,
} from "@/hooks/peer-report-queries";
import { useReceivedPeerRequests } from "@/hooks/use-peer-mentor-give";
import type {
  PeerDailyReport,
  PeerMentorSkill,
  SavePeerActivityInput,
} from "@/interfaces/peer-reports";
import { ToastTone } from "@/interfaces/toast";
import {
  addPeerActivity,
  deletePeerActivity,
  getPeerDailyReport,
  savePeerDailyReport,
  submitPeerDailyReport,
} from "@/lib/client/peer-reports";
import {
  activityInput,
  answeredDailyParts,
  DAILY_EVALUATION_PARTS,
  dailyReportForm,
  dailyReportInput,
  dailyReportReady,
  emptyActivityForm,
  meetingRowBadge,
} from "@/lib/peer-daily-report";
import { toggled } from "@/lib/peer-meeting-report";
import { peerReportBadge } from "@/lib/peer-reports";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";
import type { ActivityForm, DailyReportForm } from "@/types/peer-daily-report";
import { MeetingReportFooterNote } from "@/types/peer-meeting-report";
import { PeerReportBadge } from "@/types/peer-reports";

type Edits = { version: string; form: DailyReportForm };

/**
 * "Günlük Rapor" (Figma 221:73) for one working day: the day's meetings and activities, the five evaluation answers,
 * saving and sending (refused while a meeting report is missing), and "Faaliyet ekle" (3.2.3b).
 */
export function useDailyReport(day: string) {
  const t = useTranslations("iaIskurReports.daily");
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const key = peerDailyReportQueryKey(day);
  const query = useQuery({
    queryKey: key,
    queryFn: () => getPeerDailyReport(day),
  });
  const report = query.data;
  const version = report ? (report.updatedAt ?? `new:${day}`) : null;
  const [edits, setEdits] = useState<Edits | null>(null);
  const [activityForm, setActivityForm] = useState<ActivityForm | null>(null);
  const [activityInvalid, setActivityInvalid] = useState(false);
  const received = useReceivedPeerRequests();

  const form: DailyReportForm | null = report
    ? edits !== null && edits.version === version
      ? edits.form
      : dailyReportForm(report)
    : null;
  const editable = report?.editable ?? false;

  function update(patch: Partial<DailyReportForm>) {
    if (!form || version === null || !editable) return;
    setEdits({ version, form: { ...form, ...patch } });
  }

  function stored(saved: PeerDailyReport, sent: DailyReportForm | null) {
    queryClient.setQueryData(key, saved);
    setEdits((current) =>
      current !== null && current.form !== sent
        ? { version: saved.updatedAt ?? `new:${day}`, form: current.form }
        : null,
    );
    refreshOtherReportViews(queryClient, key);
  }

  const failed = (fallback: string) => (error: unknown) =>
    showToast({
      message: errorMessage(error, fallback),
      tone: ToastTone.Error,
    });

  const save = useMutation({
    mutationFn: (draft: DailyReportForm) =>
      savePeerDailyReport(day, dailyReportInput(draft)),
    onSuccess: (saved, draft) => {
      stored(saved, draft);
      showToast({ message: t("saved"), tone: ToastTone.Success });
    },
    onError: failed(t("saveFailed")),
  });

  const submit = useMutation({
    mutationFn: async (draft: DailyReportForm) => {
      stored(await savePeerDailyReport(day, dailyReportInput(draft)), draft);
      return submitPeerDailyReport(day);
    },
    onSuccess: (sent) => {
      stored(sent, null);
      showToast({ message: t("sent"), tone: ToastTone.Success });
    },
    onError: failed(t("sendFailed")),
  });

  const addActivity = useMutation({
    mutationFn: (input: SavePeerActivityInput) => addPeerActivity(input),
    onSuccess: () => {
      setActivityForm(null);
      void queryClient.invalidateQueries({ queryKey: key });
      refreshOtherReportViews(queryClient, key);
      showToast({ message: t("activityAdded"), tone: ToastTone.Success });
    },
    onError: failed(t("activityFailed")),
  });

  const removeActivity = useMutation({
    mutationFn: (activityId: string) => deletePeerActivity(activityId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      refreshOtherReportViews(queryClient, key);
      showToast({ message: t("activityDeleted"), tone: ToastTone.Success });
    },
    onError: failed(t("activityFailed")),
  });

  const menteeOptions = [
    ...new Map(
      received.mentees.map((request) => [
        request.mentee.userId,
        { id: request.mentee.userId, fullName: request.mentee.fullName },
      ]),
    ).values(),
  ];

  const meetingRows = (report?.meetings ?? []).map((meeting) => {
    const badge = meetingRowBadge(meeting);
    return { meeting, badge, sent: badge === PeerReportBadge.Completed };
  });
  const footerNote = report?.submittedAt
    ? MeetingReportFooterNote.Sent
    : report?.updatedAt
      ? MeetingReportFooterNote.LastSaved
      : MeetingReportFooterNote.NotSaved;

  return {
    query,
    report,
    form,
    editable,
    /** The day's pill; "Eksik Bilgi" only while the day can still change. */
    dayBadge: report
      ? peerReportBadge(
          report.status,
          editable ? report.missingMeetingReports : 0,
        )
      : null,
    meetingRows,
    showRevisionNote: editable && (report?.revisionNote ?? null) !== null,
    /** Past 23:59 and still not sent: it can be sent, marked late. */
    lateToSend:
      report !== undefined && report.late && report.submittedAt === null,
    footerNote,
    footerAt:
      footerNote === MeetingReportFooterNote.Sent
        ? (report?.submittedAt ?? null)
        : (report?.updatedAt ?? null),
    sentLate:
      report !== undefined && report.late && report.submittedAt !== null,
    evaluationDone: form
      ? answeredDailyParts(form) === DAILY_EVALUATION_PARTS
      : false,
    anyWork:
      (report?.meetings.length ?? 0) + (report?.activities.length ?? 0) > 0,
    busy: save.isPending || submit.isPending,
    answered: form ? answeredDailyParts(form) : 0,
    evaluationParts: DAILY_EVALUATION_PARTS,
    ready: report && form ? dailyReportReady(report, form) : false,
    /** "Eksik görüşme raporu varsa gönderim engellenir." */
    blockedByMeetings: (report?.missingMeetingReports ?? 0) > 0,
    meetingCount: report?.meetings.length ?? 0,
    activityCount: report?.activities.length ?? 0,
    update,
    toggleSkill: (skill: PeerMentorSkill) =>
      form && update({ skills: toggled(form.skills, skill) }),
    saveDraft: () => {
      if (form) save.mutate(form);
    },
    send: () => {
      if (
        form &&
        report &&
        dailyReportReady(report, form) &&
        !submit.isPending
      ) {
        submit.mutate(form);
      }
    },

    activityForm,
    activityInvalid,
    menteeOptions,
    activityBusy: addActivity.isPending,
    openActivity: () => {
      setActivityInvalid(false);
      setActivityForm(emptyActivityForm(day));
    },
    closeActivity: () => setActivityForm(null),
    updateActivity: (patch: Partial<ActivityForm>) =>
      setActivityForm((current) => (current ? { ...current, ...patch } : null)),
    submitActivity: () => {
      if (!activityForm) return;
      const input = activityInput(activityForm);
      if (input === null) {
        setActivityInvalid(true);
        return;
      }
      addActivity.mutate(input);
    },
    deleteActivity: (activityId: string) => removeActivity.mutate(activityId),
  };
}
