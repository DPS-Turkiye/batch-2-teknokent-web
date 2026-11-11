"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { GateBadgeState, inTraining, StudentFilter } from "@/interfaces/badges";
import { getAdminStudents } from "@/lib/client/badges";

const STATE_OF: Record<StudentFilter, GateBadgeState | null> = {
  [StudentFilter.All]: null,
  [StudentFilter.None]: GateBadgeState.None,
  [StudentFilter.InTraining]: GateBadgeState.None,
  [StudentFilter.Active]: GateBadgeState.Active,
  [StudentFilter.Revoked]: GateBadgeState.Revoked,
};

/** Admin › Kullanıcılar › Öğrenciler, narrowed by "Rozet durumu"; "Eğitimde" narrows "Rozet yok" further. */
export function useAdminStudents() {
  const [filter, setFilter] = useState<StudentFilter>(StudentFilter.All);
  const state = STATE_OF[filter];
  const query = useQuery({
    queryKey: ["admin", "students", state ?? "ALL"],
    queryFn: () => getAdminStudents(state),
  });
  const rows = query.data ?? [];
  return {
    filter,
    setFilter,
    rows: filter === StudentFilter.InTraining ? rows.filter(inTraining) : rows,
    isLoading: query.isLoading,
    error: query.error,
  };
}
