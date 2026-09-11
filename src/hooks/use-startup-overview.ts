"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useOrganizationMembers } from "@/hooks/use-organization-members";
import {
  useDocumentUrl,
  useStartupDocuments,
} from "@/hooks/use-startup-documents";
import { STARTUP_PROFILE_QUERY_KEY } from "@/hooks/use-startup-profile";
import {
  DocumentKind,
  type StartupDocument,
} from "@/interfaces/startup-document";
import { getStartupProfile } from "@/lib/client/organization";

const TEAM_PREVIEW_LIMIT = 3;
const SHARED_PREVIEW_LIMIT = 5;

// The backend lists documents newest first, so the first match is the latest.
function latestOfKind(documents: StartupDocument[], kind: DocumentKind) {
  return documents.find((document) => document.kind === kind) ?? null;
}

/** Everything the Startup Profilim tab shows, derived from live data. */
export function useStartupOverview() {
  const profileQuery = useQuery({
    queryKey: STARTUP_PROFILE_QUERY_KEY,
    queryFn: getStartupProfile,
  });
  const membersQuery = useOrganizationMembers();
  const documentsQuery = useStartupDocuments();

  const documents = useMemo(
    () => documentsQuery.data ?? [],
    [documentsQuery.data],
  );
  const canvas = useMemo(
    () => latestOfKind(documents, DocumentKind.Canvas),
    [documents],
  );
  const logo = useMemo(
    () => latestOfKind(documents, DocumentKind.Logo),
    [documents],
  );
  const logoQuery = useDocumentUrl(logo?.id);
  const sharedDocuments = useMemo(
    () =>
      documents
        .filter((document) => document.shares.length > 0)
        .slice(0, SHARED_PREVIEW_LIMIT),
    [documents],
  );
  const team = useMemo(
    () =>
      [...(membersQuery.data ?? [])]
        .sort(
          (left, right) =>
            Number(Boolean(right.founder)) - Number(Boolean(left.founder)),
        )
        .slice(0, TEAM_PREVIEW_LIMIT),
    [membersQuery.data],
  );

  return {
    canvas,
    documentsLoading: documentsQuery.isLoading,
    error: profileQuery.error,
    isLoading: profileQuery.isLoading,
    logoUrl: logoQuery.data?.url ?? null,
    profile: profileQuery.data ?? null,
    sharedDocuments,
    team,
    teamLoading: membersQuery.isLoading,
  };
}
