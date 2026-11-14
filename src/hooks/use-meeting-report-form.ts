"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  PEER_REPORTS_QUERY_KEY,
  peerMeetingReportQueryKey,
} from "@/hooks/peer-report-queries";
import {
  PeerActionOwner,
  type PeerMeetingReport,
  type PeerMeetingTopic,
  type PeerMentorSkill,
} from "@/interfaces/peer-reports";
import { ToastTone } from "@/interfaces/toast";
import {
  getPeerMeetingReport,
  savePeerMeetingReport,
  setPeerReportActionDone,
  submitPeerMeetingReport,
} from "@/lib/client/peer-reports";
import { isEnumValue } from "@/lib/enum";
import {
  MEETING_REPORT_ACTIONS_MAX,
  meetingReportForm,
  meetingReportInput,
  missingMeetingReportSections,
  newActionRow,
  productivityChoice,
  productivityValue,
  supportChoice,
  supportValue,
  toggled,
} from "@/lib/peer-meeting-report";
import { dailyReportHref } from "@/lib/peer-reports";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";
import {
  MEETING_REPORT_SECTIONS,
  MeetingReportFooterNote,
  type MeetingReportActionRow,
  type MeetingReportForm,
  type MeetingReportSection,
  type SupportChoice,
} from "@/types/peer-meeting-report";

type Edits = { version: string; form: MeetingReportForm };

/**
 * "Görüşme Raporu" (Figma 220:2): the report of one held meeting, its form state, saving a draft, sending it, and
 * ticking action steps off once it is sent. The form starts from the saved report (or the calendar's prefill) and
 * keeps the mentor's edits until a save returns them.
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
  // Edits belong to the report version they were made on; a newer copy from the server starts afresh.
  const version = report ? (report.updatedAt ?? "new") : null;
  const [edits, setEdits] = useState<Edits | null>(null);
  const [showMissing, setShowMissing] = useState(false);

  const form: MeetingReportForm | null = report
    ? edits !== null && edits.version === version
      ? edits.form
      : meetingReportForm(report)
    : null;
  const missing = form ? missingMeetingReportSections(form) : [];
  const editable = report?.editable ?? false;

  function update(patch: Partial<MeetingReportForm>) {
    if (!form || version === null || !editable) return;
    setEdits({ version, form: { ...form, ...patch } });
  }

  /**
   * Takes the server's copy. What the mentor typed while the save was on its way is kept, moved onto the new
   * version; what was sent is replaced by what came back.
   */
  function stored(saved: PeerMeetingReport, sent: MeetingReportForm | null) {
    queryClient.setQueryData(key, saved);
    setEdits((current) =>
      current !== null && current.form !== sent
        ? { version: saved.updatedAt ?? "new", form: current.form }
        : null,
    );
    // The day, week and list views count this report; they refresh from the server. This report's own query
    // already holds the server's answer, and refetching it could race the mentor's typing.
    void queryClient.invalidateQueries({
      queryKey: PEER_REPORTS_QUERY_KEY,
      predicate: (candidate) =>
        !candidate.queryKey.every((part, index) => part === key[index]),
    });
  }

  const failed = (fallback: string) => (error: unknown) =>
    showToast({
      message: errorMessage(error, fallback),
      tone: ToastTone.Error,
    });

  const save = useMutation({
    mutationFn: (draft: MeetingReportForm) =>
      savePeerMeetingReport(meetingId, meetingReportInput(draft)),
    onSuccess: (saved, draft) => {
      stored(saved, draft);
      showToast({ message: t("saved"), tone: ToastTone.Success });
    },
    onError: failed(t("saveFailed")),
  });

  const submit = useMutation({
    mutationFn: async (draft: MeetingReportForm) => {
      const saved = await savePeerMeetingReport(
        meetingId,
        meetingReportInput(draft),
      );
      // Kept even if sending then fails: the new action steps have their ids, a retry won't add them twice.
      stored(saved, draft);
      return submitPeerMeetingReport(meetingId);
    },
    onSuccess: (sent) => {
      stored(sent, null);
      showToast({ message: t("sent"), tone: ToastTone.Success });
      router.push(dailyReportHref(sent.scheduledAt));
    },
    onError: failed(t("sendFailed")),
  });

  const tickAction = useMutation({
    mutationFn: ({ actionId, done }: { actionId: string; done: boolean }) =>
      setPeerReportActionDone(meetingId, actionId, done),
    onSuccess: (saved) => stored(saved, null),
    onError: failed(t("saveFailed")),
  });

  const footerNote =
    !editable && report?.submittedAt
      ? MeetingReportFooterNote.Sent
      : report?.updatedAt
        ? MeetingReportFooterNote.LastSaved
        : MeetingReportFooterNote.NotSaved;

  return {
    query,
    report,
    form,
    editable,
    busy: save.isPending || submit.isPending,
    missing,
    showMissing,
    /** A section the mentor tried to send with an empty required answer. */
    isFlagged: (section: MeetingReportSection) =>
      showMissing && missing.includes(section),
    isSectionDone: (section: MeetingReportSection) =>
      !missing.includes(section),
    completed: MEETING_REPORT_SECTIONS.length - missing.length,
    showRevisionNote: editable && (report?.revisionNote ?? null) !== null,
    footerNote,
    footerAt:
      footerNote === MeetingReportFooterNote.Sent
        ? (report?.submittedAt ?? null)
        : (report?.updatedAt ?? null),
    support: form ? supportChoice(form.coordinatorSupportNeeded) : null,
    setSupport: (choice: SupportChoice) =>
      update({ coordinatorSupportNeeded: supportValue(choice) }),
    productivity: form ? productivityChoice(form.productivity) : null,
    setProductivity: (choice: string) =>
      update({ productivity: productivityValue(choice) }),
    update,
    toggleTopic: (topic: PeerMeetingTopic) =>
      form && update({ topics: toggled(form.topics, topic) }),
    toggleSkill: (skill: PeerMentorSkill) =>
      form && update({ skills: toggled(form.skills, skill) }),
    canAddAction:
      editable &&
      form !== null &&
      form.actions.length < MEETING_REPORT_ACTIONS_MAX,
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
    setActionOwner: (rowKey: string, value: string) => {
      if (!form || !isEnumValue(PeerActionOwner, value)) return;
      update({
        actions: form.actions.map((action) =>
          action.key === rowKey ? { ...action, owner: value } : action,
        ),
      });
    },
    removeAction: (rowKey: string) =>
      form &&
      update({
        actions: form.actions.filter((action) => action.key !== rowKey),
      }),
    /** A draft row can be ticked while editing; a sent report's saved steps are ticked on the server. */
    canTickAction: (row: MeetingReportActionRow) =>
      editable || (row.id !== null && !tickAction.isPending),
    toggleActionDone: (row: MeetingReportActionRow, done: boolean) => {
      if (editable) {
        if (form) {
          update({
            actions: form.actions.map((action) =>
              action.key === row.key ? { ...action, done } : action,
            ),
          });
        }
      } else if (row.id !== null && !tickAction.isPending) {
        tickAction.mutate({ actionId: row.id, done });
      }
    },
    saveDraft: () => {
      if (form) save.mutate(form);
    },
    /** Sends a complete report; otherwise marks what is missing and answers the first such section, for focus. */
    send: (): MeetingReportSection | null => {
      if (!form || submit.isPending) return null;
      const [first] = missing;
      if (first !== undefined) {
        setShowMissing(true);
        return first;
      }
      submit.mutate(form);
      return null;
    },
  };
}
