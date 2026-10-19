"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { getCoordinatorPrograms } from "@/lib/client/coordinator-programs";
import {
  filterPrograms,
  programFilterOptions,
  ProgramListFilter,
} from "@/lib/coordinator-programs";

export const COORDINATOR_PROGRAMS_QUERY_KEY = ["coordinator-programs"] as const;

export function useCoordinatorPrograms() {
  return useQuery({
    queryKey: COORDINATOR_PROGRAMS_QUERY_KEY,
    queryFn: () => getCoordinatorPrograms(),
  });
}

/** The Programlarım list: the programs plus the lifecycle filter and name search. */
export function useCoordinatorProgramList() {
  const t = useTranslations("coordinatorPrograms");
  const query = useCoordinatorPrograms();
  const [filter, setFilter] = useState(ProgramListFilter.All);
  const [search, setSearch] = useState("");
  const programs = query.data ?? [];

  return {
    query,
    filter,
    setFilter,
    search,
    setSearch,
    options: programFilterOptions(programs, t),
    visible: filterPrograms(programs, filter, search),
  };
}
