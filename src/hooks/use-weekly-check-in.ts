"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import {
  AttendanceState,
  type AttendanceStatus,
} from "@/interfaces/program-attendance";
import { ToastTone } from "@/interfaces/toast";
import {
  checkInMyAttendance,
  getMyAttendance,
} from "@/lib/client/program-attendance";
import { calendarDay, formatDayMonth } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

export const WEEKLY_CHECK_IN_QUERY_KEY = [
  "program-attendance",
  "mine",
] as const;

/** "10 Kas – 16 Kas" for the running week, or null when no week is running. */
export function weekRangeLabel(status: AttendanceStatus, locale: string) {
  if (!status.weekStart || !status.weekEnd) return null;
  return `${formatDayMonth(calendarDay(status.weekStart), locale)} – ${formatDayMonth(calendarDay(status.weekEnd), locale)}`;
}

/** The Süreç check-in: this week's state and the one action it allows. */
export function useWeeklyCheckIn() {
  const t = useTranslations("weeklyCheckIn");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const query = useQuery({
    queryKey: WEEKLY_CHECK_IN_QUERY_KEY,
    queryFn: getMyAttendance,
  });
  const mutation = useMutation({
    mutationFn: checkInMyAttendance,
    onSuccess: (status) => {
      queryClient.setQueryData(WEEKLY_CHECK_IN_QUERY_KEY, status);
      showToast({ message: t("done"), tone: ToastTone.Success });
    },
    onError: (error: Error) => {
      showToast({
        message: error.message || t("failed"),
        tone: ToastTone.Error,
      });
      void queryClient.invalidateQueries({
        queryKey: WEEKLY_CHECK_IN_QUERY_KEY,
      });
    },
  });

  const status = query.data;
  const week = status?.state === AttendanceState.Open ? status.week : null;
  return {
    status,
    isLoading: query.isLoading,
    error: query.error,
    /** Nothing to show for someone outside every program. */
    visible: status != null && status.state !== AttendanceState.NoProgram,
    weekRange: status ? weekRangeLabel(status, locale) : null,
    canCheckIn: week != null && !mutation.isPending,
    isCheckingIn: mutation.isPending,
    checkIn: () => {
      if (week != null) mutation.mutate(week);
    },
  };
}
