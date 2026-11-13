"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { programTeamsQueryKey } from "@/hooks/use-program-teams";
import { getTeamProcess } from "@/lib/client/startup-process";
import { dayRangeLabel } from "@/lib/program-week";
import { currentPhase } from "@/lib/startup-process";

/**
 * The team's phase in the Takımlar drawer. Every team follows its program's phases by date, so the coordinator
 * sees it here and changes the phases themselves in Program Ayarları.
 */
export function useTeamPhase(programId: string, organizationId: string) {
  const t = useTranslations("programTeams.stage");
  const locale = useLocale();
  const query = useQuery({
    queryKey: [...programTeamsQueryKey(programId), "process", organizationId],
    queryFn: () => getTeamProcess(programId, organizationId),
  });
  const phase = query.data ? currentPhase(query.data) : null;

  return {
    isLoading: query.isLoading,
    loadFailed: Boolean(query.error),
    /** The phase's name, or why there is none today. */
    title:
      phase?.name ??
      ((query.data?.phases.length ?? 0) > 0 ? t("none") : t("noPhases")),
    dates: phase ? dayRangeLabel(phase.startDate, phase.endDate, locale) : null,
  };
}
