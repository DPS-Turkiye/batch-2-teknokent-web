"use client";

import { useAppSession } from "@/components/providers/session-provider";
import { useProfileAnalysisRecord } from "@/hooks/use-profile-analysis-record";
import {
  ProfileAnalysisType,
  ProfileAnalysisRecordScope,
} from "@/interfaces/profile-analysis";
import { UserRole } from "@/interfaces/session";

export function usePersonalAnalysisArchive() {
  const session = useAppSession();
  const enabled =
    session?.role === UserRole.Mentee && Boolean(session.organizationId);
  const own = useProfileAnalysisRecord(
    ProfileAnalysisRecordScope.Personal,
    enabled,
  );
  const team = useProfileAnalysisRecord(
    ProfileAnalysisRecordScope.TeamPersonal,
    enabled,
  );
  const personal =
    own.data?.profileType === ProfileAnalysisType.Personal ? own.data : null;
  const previous =
    team.data?.profileType === ProfileAnalysisType.Personal ? team.data : null;
  return {
    analysis: enabled ? (personal ?? previous) : null,
    shared: enabled && !personal && Boolean(previous),
    isError: enabled && (own.isError || team.isError),
    retry: () => {
      if (!enabled) return;
      void own.refetch();
      void team.refetch();
    },
  };
}
