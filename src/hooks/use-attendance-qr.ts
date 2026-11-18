"use client";

import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import type {
  AttendanceSessionRef,
  SessionQr,
} from "@/interfaces/program-attendance";
import { ToastTone } from "@/interfaces/toast";
import { turkeyTime } from "@/lib/academician-office-hours";
import {
  getAttendanceSessions,
  getSessionQr,
  regenerateSessionQr,
} from "@/lib/client/program-attendance";
import {
  attendanceLink,
  attendanceSessionsQueryKey,
  sessionKindKey,
  sessionQrQueryKey,
  sessionsByWeek,
  sessionWhen,
} from "@/lib/program-attendance";
import { qrShape } from "@/lib/qr-code";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

/**
 * The coordinator's QR codes: each week's lesson and workshop, and for the one opened, a big code to project or
 * print, its link, and "Yenile" (after a confirmation) to replace it.
 */
export function useAttendanceQr(programId: string) {
  const t = useTranslations("programReport.attendanceQr");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selected, setSelected] = useState<AttendanceSessionRef | null>(null);
  const [confirming, setConfirming] = useState(false);

  const sessions = useQuery({
    queryKey: attendanceSessionsQueryKey(programId),
    queryFn: () => getAttendanceSessions(programId),
  });
  // Asked again each time a code is opened: another coordinator may have renewed it, and a dead code on the
  // projector is the worst way this can fail.
  const qr = useQuery({
    queryKey: sessionQrQueryKey(programId, selected),
    queryFn: selected ? () => getSessionQr(programId, selected) : skipToken,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
  const regenerate = useMutation({
    mutationFn: (session: AttendanceSessionRef) =>
      regenerateSessionQr(programId, session),
    onSuccess: (fresh: SessionQr) => {
      queryClient.setQueryData(sessionQrQueryKey(programId, fresh), fresh);
      setConfirming(false);
      showToast({ message: t("regenerated"), tone: ToastTone.Success });
      void queryClient.invalidateQueries({
        queryKey: attendanceSessionsQueryKey(programId),
      });
    },
    onError: (error: Error) => {
      showToast({
        message: errorMessage(error, t("failed")),
        tone: ToastTone.Error,
      });
    },
  });

  const code = selected ? qr.data : undefined;
  const link = code ? attendanceLink(window.location.origin, code.token) : null;
  const shape = useMemo(() => (link ? qrShape(link) : null), [link]);

  return {
    weeks: sessionsByWeek(sessions.data?.sessions ?? []).map((row) => ({
      week: row.week,
      label: t("week", { week: row.week }),
      sessions: [row.lesson, row.workshop].map((session) =>
        session
          ? {
              ref: { week: session.week, kind: session.kind },
              when: sessionWhen(session, locale),
              title: session.title,
              checkedIn:
                session.checkedIn > 0
                  ? t("checkedIn", { count: session.checkedIn })
                  : null,
              showLabel: t("showFor", {
                week: session.week,
                kind: t(sessionKindKey(session.kind)),
              }),
            }
          : null,
      ),
    })),
    attendanceEnabled: sessions.data?.attendanceEnabled ?? true,
    isLoading: sessions.isLoading,
    error: sessions.error,
    selected,
    open: (session: AttendanceSessionRef) => {
      setConfirming(false);
      setSelected(session);
    },
    close: () => {
      setConfirming(false);
      setSelected(null);
    },
    code:
      code && link && shape
        ? {
            heading: t("dialogTitle", {
              week: code.week,
              kind: t(sessionKindKey(code.kind)),
            }),
            programName: code.programName,
            title: code.title,
            when: sessionWhen(code, locale),
            window: code.startTime
              ? t("opens", {
                  from: turkeyTime(code.opensAt, locale),
                  to: turkeyTime(code.closesAt, locale),
                })
              : null,
            link,
            shape,
          }
        : null,
    isCodeLoading: selected !== null && qr.isLoading,
    codeError: selected ? qr.error : null,
    confirming,
    askRegenerate: () => {
      setConfirming(true);
    },
    cancelRegenerate: () => {
      setConfirming(false);
    },
    confirmRegenerate: () => {
      if (selected && !regenerate.isPending) regenerate.mutate(selected);
    },
    isRegenerating: regenerate.isPending,
    print: () => {
      window.print();
    },
  };
}
