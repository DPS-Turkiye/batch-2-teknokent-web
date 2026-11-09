"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { useToast } from "@/stores/toast-store";
import { STUDENT_APPOINTMENTS_QUERY_KEY } from "@/hooks/use-student-appointments";
import { STUDENT_HOME_QUERY_KEY } from "@/hooks/use-student-home";
import type { Appointment } from "@/interfaces/appointment";
import {
  getMentorAvailability,
  scheduleMeeting,
} from "@/lib/client/mentor-requests";
import { getStudentAppointments } from "@/lib/client/student-appointments";
import { ToastTone } from "@/interfaces/toast";

export const peerSessionSlotsQueryKey = (requestId: string) =>
  ["peer-mentoring", "slots", requestId] as const;

/** The session booked on each of the student's peer requests, by request id. */
export function usePeerRequestSessions() {
  const query = useQuery({
    queryKey: STUDENT_APPOINTMENTS_QUERY_KEY,
    queryFn: getStudentAppointments,
  });
  const byRequest = useMemo(() => {
    const sessions = new Map<string, Appointment>();
    for (const item of query.data ?? []) {
      if (item.requestId) sessions.set(item.requestId, item);
    }
    return sessions;
  }, [query.data]);
  return { byRequest, isLoading: query.isLoading };
}

/**
 * "Randevu al" on an accepted peer request: the mentor's free slots and booking one. The backend
 * books for the session's student only and refuses a second booking on the same request.
 */
export function usePeerSessionBooking(requestId: string, onBooked: () => void) {
  const t = useTranslations(
    "odtuWorkspaces.student.peerMentoring.requests.booking",
  );
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const slots = useQuery({
    queryKey: peerSessionSlotsQueryKey(requestId),
    queryFn: () => getMentorAvailability(requestId),
  });
  const book = useMutation({
    mutationFn: (slotId: string) => scheduleMeeting({ id: requestId, slotId }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: STUDENT_APPOINTMENTS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({ queryKey: STUDENT_HOME_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: peerSessionSlotsQueryKey(requestId),
        }),
      ]);
      showToast({ message: t("booked"), tone: ToastTone.Success });
      onBooked();
    },
  });
  return {
    slots: slots.data ?? [],
    isLoading: slots.isLoading,
    loadError: slots.error,
    book: (slotId: string) => book.mutate(slotId),
    isBooking: book.isPending,
    bookError: book.error,
  };
}
