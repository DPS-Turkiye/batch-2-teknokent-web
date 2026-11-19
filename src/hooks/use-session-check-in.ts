"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { WEEKLY_ATTENDANCE_QUERY_KEY } from "@/hooks/use-weekly-attendance";
import { checkInSession } from "@/lib/client/program-attendance";
import {
  checkInFailure,
  isAlreadyRecorded,
  sessionKindKey,
  sessionWhen,
} from "@/lib/program-attendance";
import { errorMessage } from "@/lib/utils";
import { CheckInFailure, CheckInPhase } from "@/types/attendance";

/**
 * The QR link page: sends the check-in once, from the browser after the page loads, so a link preview or a
 * prefetch that only fetches the page never records anyone.
 */
export function useSessionCheckIn(token: string) {
  const t = useTranslations("attendCheckIn");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { mutate, data, error, isError, isSuccess } = useMutation({
    mutationFn: (scanned: string) => checkInSession(scanned),
    // Süreç's "Bu haftaki yoklaman" card shows the new check-in the next time it is opened.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: WEEKLY_ATTENDANCE_QUERY_KEY }),
  });
  const sentFor = useRef<string | null>(null);

  useEffect(() => {
    // Strict Mode runs effects twice in development; one scan is one request.
    if (sentFor.current === token) return;
    sentFor.current = token;
    mutate(token);
  }, [token, mutate]);

  const raced = isError && isAlreadyRecorded(error);
  const failure = isError && !raced ? checkInFailure(error) : null;
  const phase = isSuccess
    ? data.alreadyRecorded
      ? CheckInPhase.AlreadyRecorded
      : CheckInPhase.Recorded
    : raced
      ? CheckInPhase.AlreadyRecorded
      : isError
        ? CheckInPhase.Failed
        : CheckInPhase.Checking;

  return {
    phase,
    session: data
      ? {
          programName: data.programName,
          label: t("session", {
            week: data.week,
            kind: t(sessionKindKey(data.kind)),
          }),
          when: sessionWhen(data, locale),
          title: data.title,
        }
      : null,
    /** The backend's own sentence: why nothing was recorded, and when the code works. */
    message: isError && !raced ? errorMessage(error, t("failed")) : null,
    /** Only a failure that may pass on its own (network, server) is worth another try. */
    canRetry: failure === CheckInFailure.Failed,
    retry: () => {
      mutate(token);
    },
  };
}
