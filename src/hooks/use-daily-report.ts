"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import {
  peerDailyReportQueryKey,
  refreshOtherReportViews,
} from "@/hooks/peer-report-queries";
import { useReceivedPeerRequests } from "@/hooks/use-peer-mentor-give";
import { useReportDuration } from "@/hooks/use-report-format";
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
  activityTimeLabel,
  answeredDailyParts,
  DAILY_EVALUATION_PARTS,
  dailyReportForm,
  dailyReportInput,
  dailyReportReady,
  emptyActivityForm,
  invalidActivityFields,
  meetingRowBadge,
} from "@/lib/peer-daily-report";
import { toggled } from "@/lib/peer-meeting-report";
import { meetingReportHref, peerReportBadge } from "@/lib/peer-reports";
import {
  formatReportDeadline,
  formatReportTime,
} from "@/lib/peer-weekly-report";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";
import type { ActivityForm, DailyReportForm } from "@/types/peer-daily-report";
import { PeerReportBadge } from "@/types/peer-reports";

type Edits = { version: string; form: DailyReportForm };

/**
 * "Günlük Rapor" (Figma 221:73) for one working day: the day's meetings and activities, the five evaluation answers,
 * saving and sending (refused while a meeting report is missing), and "Faaliyet ekle" (3.2.3b). Mount it per day
 * (`key={day}`): a save's answer then always belongs to the day it was made on.
 */
export function useDailyReport(day: string) {
  const t = useTranslations("iaIskurReports");
  const locale = useLocale();
  const duration = useReportDuration();
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
  const [activityTried, setActivityTried] = useState(false);
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
    // Typing during a save is kept on the new version; a locked (sent) day keeps nothing unsaved.
    setEdits((current) =>
      saved.editable && current !== null && current.form !== sent
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
      showToast({ message: t("daily.saved"), tone: ToastTone.Success });
    },
    onError: failed(t("daily.saveFailed")),
  });

  const submit = useMutation({
    mutationFn: async (draft: DailyReportForm) => {
      stored(await savePeerDailyReport(day, dailyReportInput(draft)), draft);
      return submitPeerDailyReport(day);
    },
    onSuccess: (sent) => {
      stored(sent, null);
      showToast({ message: t("daily.sent"), tone: ToastTone.Success });
    },
    onError: failed(t("daily.sendFailed")),
  });

  const afterActivityChange = (message: string) => {
    void queryClient.invalidateQueries({ queryKey: key });
    refreshOtherReportViews(queryClient, key);
    showToast({ message, tone: ToastTone.Success });
  };

  const addActivity = useMutation({
    mutationFn: (input: SavePeerActivityInput) => addPeerActivity(input),
    onSuccess: () => {
      setActivityForm(null);
      afterActivityChange(t("daily.activityAdded"));
    },
    onError: failed(t("daily.activityFailed")),
  });

  const removeActivity = useMutation({
    mutationFn: (activityId: string) => deletePeerActivity(activityId),
    onSuccess: () => afterActivityChange(t("daily.activityDeleted")),
    onError: failed(t("daily.activityFailed")),
  });

  const meetingRows = (report?.meetings ?? []).map((meeting) => {
    const badge = meetingRowBadge(meeting);
    const sent = badge === PeerReportBadge.Completed;
    return {
      id: meeting.meetingId,
      time: activityTimeLabel(meeting.scheduledAt, locale),
      title: t("daily.meetingTitle", { name: meeting.menteeName }),
      meta: [
        meeting.meetingType ? t(`meeting.types.${meeting.meetingType}`) : null,
        meeting.meetingFormat
          ? t(`meeting.formats.${meeting.meetingFormat}`)
          : null,
        duration(meeting.durationMinutes),
      ]
        .filter((part) => part !== null)
        .join(t("daily.separator")),
      badge,
      sent,
      statusText: sent ? t("daily.reportSent") : t("daily.reportWaiting"),
      href: meetingReportHref(meeting.meetingId),
      actionLabel: sent ? t("daily.openReport") : t("daily.fillReport"),
      readyLabel: sent
        ? t("daily.readyMeeting", { name: meeting.menteeName })
        : t("daily.readyMeetingMissing", { name: meeting.menteeName }),
    };
  });

  const activityRows = (report?.activities ?? []).map((activity) => ({
    id: activity.id,
    time: activityTimeLabel(activity.createdAt, locale),
    title: activity.title,
    meta: t("activity.meta", {
      type: t(`activity.types.${activity.type}`),
      duration: duration(activity.durationMinutes),
    }),
    deleteLabel: t("daily.deleteActivity", { title: activity.title }),
  }));

  const answered = form ? answeredDailyParts(form) : 0;
  const anyWork = meetingRows.length + activityRows.length > 0;
  const savedText = report?.submittedAt
    ? t("daily.sentNote", {
        time: formatReportTime(report.submittedAt, locale),
      }) + (report.late ? `${t("daily.separator")}${t("daily.sentLate")}` : "")
    : report?.updatedAt
      ? t("daily.lastSaved", {
          time: formatReportTime(report.updatedAt, locale),
        })
      : t("daily.notSaved");

  const menteeOptions = [
    ...new Map(
      received.mentees.map((request) => [
        request.mentee.userId,
        { id: request.mentee.userId, fullName: request.mentee.fullName },
      ]),
    ).values(),
  ];

  return {
    query,
    report,
    form,
    editable,
    readOnly: !editable,
    busy: save.isPending || submit.isPending,
    ready: report && form ? dailyReportReady(report, form) : false,
    /** "Eksik görüşme raporu varsa gönderim engellenir." */
    blockedByMeetings: (report?.missingMeetingReports ?? 0) > 0,
    /** The day's pill; "Eksik Bilgi" only while the day can still change. */
    dayBadge: report
      ? peerReportBadge(
          report.status,
          editable ? report.missingMeetingReports : 0,
        )
      : null,
    showRevisionNote: editable && (report?.revisionNote ?? null) !== null,
    revisionNote: report?.revisionNote ?? "",
    meetingRows,
    activityRows,
    anyWork,
    meetingCount: meetingRows.length,
    activityCount: activityRows.length,
    recorded: duration(report?.recordedMinutes ?? 0),
    readyLines: [
      { id: "activities", done: anyWork, label: t("daily.readyActivities") },
      ...meetingRows.map((row) => ({
        id: row.id,
        done: row.sent,
        label: row.readyLabel,
      })),
      {
        id: "evaluation",
        done: answered === DAILY_EVALUATION_PARTS,
        label: t("daily.readyEvaluation", {
          count: answered,
          total: DAILY_EVALUATION_PARTS,
        }),
      },
    ],
    /** Past 23:59 and not sent: it can still go, marked late. */
    deadlineText:
      report && report.late && report.submittedAt === null
        ? t("daily.late")
        : t("daily.deadline", {
            time: report ? formatReportDeadline(report.deadline, locale) : "",
          }),
    savedText,
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
    /** The activity form's fields that stop it, once the mentor tried to add it. */
    activityErrors:
      activityTried && activityForm
        ? invalidActivityFields(activityForm)
        : null,
    menteeOptions,
    activityBusy: addActivity.isPending,
    deletingActivityId: removeActivity.isPending
      ? removeActivity.variables
      : null,
    openActivity: () => {
      setActivityTried(false);
      setActivityForm(emptyActivityForm(day));
    },
    closeActivity: () => setActivityForm(null),
    updateActivity: (patch: Partial<ActivityForm>) =>
      setActivityForm((current) => (current ? { ...current, ...patch } : null)),
    submitActivity: () => {
      if (!activityForm || addActivity.isPending) return;
      const input = activityInput(activityForm);
      if (input === null) {
        setActivityTried(true);
        return;
      }
      addActivity.mutate(input);
    },
    deleteActivity: (activityId: string) => {
      if (!removeActivity.isPending) removeActivity.mutate(activityId);
    },
  };
}
