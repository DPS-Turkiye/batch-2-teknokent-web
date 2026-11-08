"use client";

import { useQuery } from "@tanstack/react-query";

import {
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
