"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import type {
  AdminOverview,
  AdminOverviewResponse,
} from "@/interfaces/admin-overview";
import { getAdminOverview } from "@/lib/client/admin-overview";

export const ADMIN_OVERVIEW_QUERY_KEY = ["admin-overview"] as const;

/** Rows of a student's personal team carry no team name; they read as peer mentoring instead. */
export function labelPersonalTeams(
  overview: AdminOverviewResponse,
  label: string,
): AdminOverview {
  const named = <T extends { organizationName: string | null }>(row: T) => ({
    ...row,
    organizationName: row.organizationName ?? label,
  });
  return {
    ...overview,
    mentorships: overview.mentorships.map(named),
    requests: overview.requests.map(named),
    bottlenecks: overview.bottlenecks.map(named),
  };
}

export function useAdminOverview() {
  const t = useTranslations("adminCommon");
  const label = t("peerMentorship");
  return useQuery({
    queryKey: ADMIN_OVERVIEW_QUERY_KEY,
    queryFn: getAdminOverview,
    select: (overview) => labelPersonalTeams(overview, label),
  });
}
