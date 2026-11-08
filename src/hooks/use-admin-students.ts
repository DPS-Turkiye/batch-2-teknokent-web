"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { GateBadgeState } from "@/interfaces/badges";
import { getAdminStudents } from "@/lib/client/badges";

/** Admin › Kullanıcılar › Öğrenciler, narrowed by "Rozet durumu". */
export function useAdminStudents() {
  const [state, setState] = useState<GateBadgeState | null>(null);
  const query = useQuery({
    queryKey: ["admin", "students", state ?? "ALL"],
    queryFn: () => getAdminStudents(state),
  });
  return {
    state,
    setState,
    rows: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
