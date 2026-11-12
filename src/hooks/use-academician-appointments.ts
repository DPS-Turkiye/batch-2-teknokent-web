"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState, type SubmitEvent } from "react";

import type { AcademicianAppointment } from "@/interfaces/academician-office-hours";
import { ToastTone } from "@/interfaces/toast";
import {
  ACADEMICIAN_APPOINTMENTS_QUERY_KEY,
  ACADEMICIAN_OFFICE_HOURS_QUERY_KEY,
  groupAppointments,
} from "@/lib/academician-office-hours";
import {
  cancelAcademicianAppointment,
  getAcademicianAppointments,
} from "@/lib/client/academician-office-hours";
import { useToast } from "@/stores/toast-store";

export enum AppointmentsView {
  Upcoming = "upcoming",
  Past = "past",
  Cancelled = "cancelled",
}

/** Cancelling closer than this to the start needs a reason for the student. */
export const LATE_CANCEL_MS = 24 * 60 * 60 * 1000;

/** Randevularım: confirmed appointments and cancelling one where the source allows it. */
export function useAcademicianAppointments() {
  const t = useTranslations("academicianWorkspace.appointments");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const query = useQuery({
    queryKey: ACADEMICIAN_APPOINTMENTS_QUERY_KEY,
    queryFn: getAcademicianAppointments,
  });
  const [view, setView] = useState(AppointmentsView.Upcoming);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const cancel = useMutation({
    mutationFn: ({ id, why }: { id: string; why: string | null }) =>
      cancelAcademicianAppointment(id, why),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ACADEMICIAN_OFFICE_HOURS_QUERY_KEY,
      });
      showToast({ message: t("cancelledToast"), tone: ToastTone.Success });
      setCancelling(null);
    },
    onError: () => {
      void query.refetch();
      showToast({ message: t("cancelFailed"), tone: ToastTone.Error });
      setCancelling(null);
    },
  });

  const isLate = (appointment: AcademicianAppointment) =>
    Date.parse(appointment.startsAt) - Date.now() < LATE_CANCEL_MS;

  const submitCancel =
    (appointment: AcademicianAppointment) => (event: SubmitEvent) => {
      event.preventDefault();
      const why = reason.trim() || null;
      if (!why && isLate(appointment)) {
        setFormError(t("needReason"));
        return;
      }
      cancel.mutate({ id: appointment.id, why });
    };

  // As of the last load, so a render stays pure; each refetch moves it forward.
  const groups = groupAppointments(query.data ?? [], query.dataUpdatedAt);
  return {
    view,
    setView,
    counts: {
      [AppointmentsView.Upcoming]: groups.upcoming.length,
      [AppointmentsView.Past]: groups.past.length,
      [AppointmentsView.Cancelled]: groups.cancelled.length,
    },
    shown: groups[view],
    isEmpty: query.data?.length === 0,
    isLoading: query.isLoading,
    error: query.error,
    retry: () => void query.refetch(),
    isRetrying: query.isFetching,
    cancelling,
    startCancel: (id: string) => {
      setCancelling(id);
      setReason("");
      setFormError(null);
    },
    stopCancel: () => setCancelling(null),
    reason,
    setReason: (value: string) => {
      setReason(value);
      setFormError(null);
    },
    formError,
    isLate,
    submitCancel,
    isCancelling: cancel.isPending,
  };
}

export type AcademicianAppointmentsState = ReturnType<
  typeof useAcademicianAppointments
>;
