"use client";

import { useQuery } from "@tanstack/react-query";

import { programTeamsQueryKey } from "@/hooks/use-program-teams";
import { getProgramTeamDetail } from "@/lib/client/coordinator-programs";

/** The Takımlar drawer for one joined team; nothing loads until a team is opened. */
export function useProgramTeamDetail(
  programId: string,
  organizationId: string | null,
) {
  return useQuery({
    queryKey: [...programTeamsQueryKey(programId), "detail", organizationId],
    queryFn: () => getProgramTeamDetail(programId, organizationId!),
    enabled: Boolean(organizationId),
  });
}
