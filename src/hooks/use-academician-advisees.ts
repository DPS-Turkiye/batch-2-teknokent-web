"use client";

import { useState } from "react";

import { useInstitutionAdvisees } from "@/hooks/use-institution-record";

/** Danışan Öğrencilerim: the academician's advisees from ODTÜ's records, searchable by name. */
export function useAcademicianAdvisees() {
  const [search, setSearch] = useState("");
  const query = useInstitutionAdvisees();
  const all = query.data ?? [];
  const needle = search.trim().toLocaleLowerCase("tr");
  const advisees = all
    .filter(
      (person) =>
        !needle || person.fullName.toLocaleLowerCase("tr").includes(needle),
    )
    .toSorted((a, b) => a.fullName.localeCompare(b.fullName, "tr"));
  return {
    advisees,
    total: all.length,
    search,
    setSearch,
    isLoading: query.isLoading,
    error: query.error,
    retry: () => void query.refetch(),
    isRetrying: query.isFetching,
  };
}
