"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { useInstitutionRecord } from "@/hooks/use-institution-record";
import {
  PEER_MENTORS_QUERY_KEY,
  usePeerMentoringRequests,
} from "@/hooks/use-peer-mentoring";
import { getPeerMentors } from "@/lib/client/peer-mentoring";
import { getStudentHome } from "@/lib/client/student-home";
import {
  greetingName,
  openPeerRequests,
  recommendedPeerMentors,
  summarizeAppointments,
} from "@/lib/student-home";
import { dayPart } from "@/lib/utils";

export const STUDENT_HOME_QUERY_KEY = ["student-home"] as const;
export const STUDENT_PROFILE_COMPLETION_HREF = "/student/profile/complete";
const STUDENT_PROFILE_HREF = "/student/profile";
const NO_FILTER = { category: null, query: "" } as const;

/** Ana Sayfa: the next session, what waits on an answer, the advisor and two peer mentors to ask. */
export function useStudentHome() {
  const tCommon = useTranslations("common");
  const home = useQuery({
    queryKey: STUDENT_HOME_QUERY_KEY,
    queryFn: getStudentHome,
  });
  const record = useInstitutionRecord();
  const requests = usePeerMentoringRequests();
  // The directory's unfiltered list, so both screens share one cache entry.
  const mentors = useQuery({
    queryKey: [...PEER_MENTORS_QUERY_KEY, NO_FILTER.category, NO_FILTER.query],
    queryFn: () => getPeerMentors(NO_FILTER),
  });

  // As of the last load, so a render stays pure; each refetch moves it forward.
  const now = new Date(home.dataUpdatedAt);
  const appointments = summarizeAppointments(
    home.data?.appointments ?? [],
    now,
  );
  const peerRequests = openPeerRequests(requests.data ?? []);

  return {
    isLoading: home.isLoading,
    error: home.error,
    ready: home.data !== undefined,
    greeting: tCommon(`greeting.${dayPart(now)}`),
    name: greetingName(record.data?.fullName),
    advisor: record.data?.advisor ?? null,
    profileHref: home.data?.profileCompleted
      ? STUDENT_PROFILE_HREF
      : STUDENT_PROFILE_COMPLETION_HREF,
    next: appointments.next,
    upcoming: appointments.upcoming,
    confirmedCount: appointments.confirmedCount,
    awaiting: appointments.awaiting,
    peerRequests,
    requestCount: appointments.awaiting.length + peerRequests.length,
    mentors: recommendedPeerMentors(mentors.data ?? []),
  };
}

export type StudentHomeModel = ReturnType<typeof useStudentHome>;
