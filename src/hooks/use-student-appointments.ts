"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AppointmentStatus } from "@/interfaces/appointment";
import { splitAppointments } from "@/lib/appointments";
import { getStudentAppointments } from "@/lib/client/student-appointments";

export const STUDENT_APPOINTMENTS_QUERY_KEY = ["student-appointments"] as const;

/** Randevularım: upcoming and past sessions, narrowed to one status when the student picks one. */
export function useStudentAppointments() {
  const [status, setStatus] = useState<AppointmentStatus | null>(null);
  const query = useQuery({
    queryKey: STUDENT_APPOINTMENTS_QUERY_KEY,
    queryFn: getStudentAppointments,
  });
  const all = query.data ?? [];
  const shown = all.filter((item) => status === null || item.status === status);
  const { upcoming, past } = splitAppointments(shown, new Date());
  return {
    upcoming,
    past,
    /** Only the statuses the student actually has, in the enum's order. */
    statuses: Object.values(AppointmentStatus).filter((candidate) =>
      all.some((item) => item.status === candidate),
    ),
    status,
    setStatus,
    isLoading: query.isLoading,
    error: query.error,
    retry: () => {
      void query.refetch();
    },
    isRetrying: query.isFetching,
    isEmpty: query.data?.length === 0,
  };
}
