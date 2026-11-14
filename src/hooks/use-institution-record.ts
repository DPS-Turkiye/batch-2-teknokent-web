"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchAdviseeProfile,
  fetchInstitutionAdvisees,
  fetchInstitutionRecord,
} from "@/lib/client/institution";

export const INSTITUTION_RECORD_QUERY_KEY = ["institution", "me"];
export const INSTITUTION_ADVISEES_QUERY_KEY = ["institution", "me", "advisees"];

/** The read-only ODTÜ record ("Kurumsal Bilgiler") of the signed-in person. */
export function useInstitutionRecord(enabled = true) {
  return useQuery({
    queryKey: INSTITUTION_RECORD_QUERY_KEY,
    queryFn: fetchInstitutionRecord,
    enabled,
  });
}

/** An academician's advisees ("Danışan Öğrencilerim"); empty for everyone else. */
export function useInstitutionAdvisees(enabled = true) {
  return useQuery({
    queryKey: INSTITUTION_ADVISEES_QUERY_KEY,
    queryFn: fetchInstitutionAdvisees,
    enabled,
  });
}

export function adviseeProfileQueryKey(userId: string) {
  return [...INSTITUTION_ADVISEES_QUERY_KEY, userId, "profile"];
}

/**
 * One advisee's interests and goal for their advisor; null for anyone else's student. Waits for an id: a student
 * who has never signed in to Menton has none.
 */
export function useAdviseeProfile(userId: string | null) {
  return useQuery({
    queryKey: adviseeProfileQueryKey(userId ?? ""),
    queryFn: () => fetchAdviseeProfile(userId ?? ""),
    enabled: userId !== null,
  });
}
