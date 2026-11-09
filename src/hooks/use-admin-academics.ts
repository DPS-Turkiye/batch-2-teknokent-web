"use client";

import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import {
  AcademicFilter,
  type AdminAcademic,
} from "@/interfaces/admin-academics";
import {
  academicCounts,
  academicDepartments,
  filterAcademics,
} from "@/lib/admin-academics";
import {
  getAdminAcademics,
  getProgramAcademics,
} from "@/lib/client/admin-academics";

export const ADMIN_ACADEMICS_QUERY_KEY = ["admin", "academics"] as const;

export const programAcademicsQueryKey = (programId: string) =>
  ["program", programId, "academics"] as const;

/** Admin › Kullanıcılar › Akademisyenler: the list, its filters and the open drawer. */
export function useAdminAcademics() {
  return useAcademicsList(
    useQuery({
      queryKey: ADMIN_ACADEMICS_QUERY_KEY,
      queryFn: getAdminAcademics,
    }),
  );
}

/** An Office Hours program's Katılımcılar › Akademisyenler (no e-mail or sign-in time). */
export function useProgramAcademics(programId: string) {
  return useAcademicsList(
    useQuery({
      queryKey: programAcademicsQueryKey(programId),
      queryFn: () => getProgramAcademics(programId),
    }),
  );
}

export type AcademicsList = ReturnType<typeof useAcademicsList>;

function useAcademicsList(query: UseQueryResult<AdminAcademic[]>) {
  const [filter, setFilter] = useState(AcademicFilter.All);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const all = query.data ?? [];

  return {
    isLoading: query.isLoading,
    error: query.error,
    total: all.length,
    rows: filterAcademics(all, { filter, query: search, department }),
    counts: academicCounts(all),
    departments: academicDepartments(all),
    filter,
    setFilter,
    search,
    setSearch,
    department,
    setDepartment,
    open: all.find((row) => row.personId === openId) ?? null,
    openDrawer: setOpenId,
    closeDrawer: () => setOpenId(null),
  };
}
