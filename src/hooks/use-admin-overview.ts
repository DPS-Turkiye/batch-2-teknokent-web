"use client";

import { useQuery } from "@tanstack/react-query";

import { getAdminOverview } from "@/lib/client/admin-overview";

export const ADMIN_OVERVIEW_QUERY_KEY = ["admin-overview"] as const;

export function useAdminOverview() {
  return useQuery({
    queryKey: ADMIN_OVERVIEW_QUERY_KEY,
    queryFn: getAdminOverview,
  });
}
