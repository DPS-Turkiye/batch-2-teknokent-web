"use client";

import { useQuery } from "@tanstack/react-query";

import {
  ACADEMICIAN_APPOINTMENTS_QUERY_KEY,
  groupAppointments,
} from "@/hooks/use-academician-appointments";
import {
  ACADEMICIAN_REQUESTS_QUERY_KEY,
  waitsForAcademician,
} from "@/hooks/use-academician-requests";
import {
  useInstitutionAdvisees,
  useInstitutionRecord,
} from "@/hooks/use-institution-record";
import {
  getAcademicianAppointments,
  getAcademicianRequests,
} from "@/lib/client/academician-office-hours";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const PREVIEW = 3;

/** Ana Sayfa: what needs the academician now, from the same queries as the other screens. */
export function useAcademicianHome() {
  const record = useInstitutionRecord();
  const advisees = useInstitutionAdvisees();
  const requests = useQuery({
    queryKey: ACADEMICIAN_REQUESTS_QUERY_KEY,
    queryFn: getAcademicianRequests,
  });
  const appointments = useQuery({
    queryKey: ACADEMICIAN_APPOINTMENTS_QUERY_KEY,
    queryFn: getAcademicianAppointments,
  });

  // As of the last load, so a render stays pure; each refetch moves it forward.
  const now = appointments.dataUpdatedAt;
  const upcoming = groupAppointments(appointments.data ?? [], now).upcoming;
  const waiting = (requests.data ?? [])
    .filter(waitsForAcademician)
    .toSorted((a, b) => Date.parse(b.requestedAt) - Date.parse(a.requestedAt));
  const name = record.data
    ? [record.data.academicTitle, record.data.fullName]
        .filter(Boolean)
        .join(" ")
    : null;

  return {
    name,
    pendingCount: waiting.length,
    weekCount: upcoming.filter(
      (item) => Date.parse(item.startsAt) < now + WEEK_MS,
    ).length,
    adviseeCount: advisees.data?.length ?? null,
    nextAppointments: upcoming.slice(0, PREVIEW),
    latestRequests: waiting.slice(0, PREVIEW),
    isLoading: requests.isLoading || appointments.isLoading,
    error: requests.error ?? appointments.error,
    retry: () => {
      void requests.refetch();
      void appointments.refetch();
    },
  };
}
