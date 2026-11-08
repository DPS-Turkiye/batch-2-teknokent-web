"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AppointmentStatus } from "@/interfaces/appointment";
import { getStudentAppointments } from "@/lib/client/student-appointments";

export const STUDENT_APPOINTMENTS_QUERY_KEY = ["student-appointments"] as const;

export function useStudentAppointments() {
  const [status, setStatus] = useState<AppointmentStatus | null>(null);
  const query = useQuery({
    queryKey: STUDENT_APPOINTMENTS_QUERY_KEY,
    queryFn: getStudentAppointments,
  });
  const appointments = (query.data ?? [])
    .filter((item) => status === null || item.status === status)
    .toSorted((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  return {
    appointments,
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
