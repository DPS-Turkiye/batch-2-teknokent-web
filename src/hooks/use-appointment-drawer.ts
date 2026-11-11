"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState, type SubmitEvent } from "react";

import {
  OfficeHoursAppointmentAction,
  type AcademicianAppointment,
} from "@/interfaces/academician-office-hours";
import { ToastTone } from "@/interfaces/toast";
import { cancelNeedsReason } from "@/lib/academician-calendar";
import { ACADEMICIAN_OFFICE_HOURS_QUERY_KEY } from "@/lib/academician-office-hours";
import { cancelAcademicianAppointment } from "@/lib/client/academician-office-hours";
import { formatDateRange } from "@/lib/format";
import { useToast } from "@/stores/toast-store";

/** The appointment drawer: its details, and cancelling it where the source allows. */
export function useAppointmentDrawer(
  appointment: AcademicianAppointment,
  { now, onClose }: { now: Date; onClose: () => void },
) {
  const t = useTranslations("iaAcademician.appointmentDrawer");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const cancel = useMutation({
    mutationFn: (why: string | null) =>
      cancelAcademicianAppointment(appointment.id, why),
    onSuccess: () => {
      showToast({ message: t("cancelled"), tone: ToastTone.Success });
      onClose();
    },
    onError: () => {
      showToast({ message: t("failed"), tone: ToastTone.Error });
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: ACADEMICIAN_OFFICE_HOURS_QUERY_KEY,
      }),
  });

  const needsReason = cancelNeedsReason(appointment, now);
  const start = new Date(appointment.startsAt);

  return {
    date: new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
      weekday: "long",
    }).format(start),
    hours: formatDateRange(
      new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }),
      start,
      new Date(appointment.endsAt),
    ),
    canCancel:
      appointment.allowedActions.includes(
        OfficeHoursAppointmentAction.Cancel,
      ) && start.getTime() > now.getTime(),
    cancelling,
    startCancel: () => {
      setCancelling(true);
      setReason("");
      setError(null);
    },
    stopCancel: () => {
      setCancelling(false);
    },
    reason,
    setReason: (value: string) => {
      setReason(value);
      setError(null);
    },
    needsReason,
    error,
    submit: (event: SubmitEvent) => {
      event.preventDefault();
      const why = reason.trim() || null;
      if (why === null && needsReason) {
        setError(t("reasonRequired"));
        return;
      }
      cancel.mutate(why);
    },
    isCancelling: cancel.isPending,
  };
}

export type AppointmentDrawerState = ReturnType<typeof useAppointmentDrawer>;
