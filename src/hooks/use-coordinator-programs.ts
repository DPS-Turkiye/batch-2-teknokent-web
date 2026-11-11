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
import {
  ALL_PROGRAM_TYPES,
  PROGRAM_TYPE_FILTERS,
  type ProgramTypeFilter,
} from "@/lib/program-types";

export const COORDINATOR_PROGRAMS_QUERY_KEY = ["coordinator-programs"] as const;

export function useCoordinatorPrograms() {
  return useQuery({
    queryKey: COORDINATOR_PROGRAMS_QUERY_KEY,
    queryFn: () => getCoordinatorPrograms(),
  });
}

/** The Programlarım list: the programs plus the lifecycle and type filters and the name search. */
export function useCoordinatorProgramList() {
  const t = useTranslations("coordinatorPrograms");
  const tType = useTranslations("programTypes");
  const query = useCoordinatorPrograms();
  const [filter, setFilter] = useState(ProgramListFilter.All);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<ProgramTypeFilter>(ALL_PROGRAM_TYPES);
  const programs = query.data ?? [];

  return {
    query,
    filter,
    setFilter,
    search,
    setSearch,
    options: programFilterOptions(programs, t),
    type,
    setType,
    typeOptions: PROGRAM_TYPE_FILTERS.map((id) => ({ id, label: tType(id) })),
    visible: filterPrograms(programs, filter, search, type),
  };
}
