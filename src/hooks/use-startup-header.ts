"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { useOrganizationPrograms } from "@/hooks/use-programs";
import {
  useDocumentUrl,
  useStartupDocuments,
} from "@/hooks/use-startup-documents";
import { STARTUP_PROCESS_QUERY_KEY } from "@/hooks/use-startup-process";
import { STARTUP_PROFILE_QUERY_KEY } from "@/hooks/use-startup-profile";
import { DocumentKind } from "@/interfaces/startup-document";
import { getStartupProfile } from "@/lib/client/organization";
import { getStartupProcess } from "@/lib/client/startup-process";
import { initials } from "@/lib/utils";

/** The Startup'ım header: the startup, its program and its two status chips. */
export function useStartupHeader() {
  const tStages = useTranslations("startupStages");
  const profileQuery = useQuery({
    queryKey: STARTUP_PROFILE_QUERY_KEY,
    queryFn: getStartupProfile,
  });
  const processQuery = useQuery({
    queryKey: STARTUP_PROCESS_QUERY_KEY,
    queryFn: getStartupProcess,
  });
  const programsQuery = useOrganizationPrograms();
  const documentsQuery = useStartupDocuments();

  // The backend lists documents newest first, so the first logo is the latest.
  const logo = useMemo(
    () =>
      (documentsQuery.data ?? []).find(
        (document) => document.kind === DocumentKind.Logo,
      ) ?? null,
    [documentsQuery.data],
  );
  const logoQuery = useDocumentUrl(logo?.id);

  const profile = profileQuery.data ?? null;
  const programs = programsQuery.data;
  const program =
    programs?.programs.find(
      (candidate) => candidate.id === programs.activeProgramId,
    ) ??
    programs?.programs[0] ??
    null;
  const stage = processQuery.data?.currentStage ?? null;

  return {
    fundingStage: profile?.fundingStage ?? null,
    initials: profile ? initials(profile.name) : "",
    isLoading: profileQuery.isLoading,
    logoUrl: logoQuery.data?.url ?? null,
    name: profile?.name ?? null,
    programName: program?.name ?? null,
    stageName: stage ? tStages(stage) : null,
  };
}
