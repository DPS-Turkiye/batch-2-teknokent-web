"use client";

import { useQuery } from "@tanstack/react-query";

import { listDocuments } from "@/lib/client/documents";
import { currentIdToken } from "@/lib/firebase/auth";

/**
 * What the wizard has already persisted for this Firebase user, keyed by
 * document kind. A brand-new signup has none yet; a resumed one (after a
 * reload dropped the in-memory File objects) may already have some.
 */
export const STORED_DOCUMENTS_QUERY_KEY = ["signup-stored-documents"] as const;

export function useStoredDocuments() {
  const query = useQuery({
    queryKey: STORED_DOCUMENTS_QUERY_KEY,
    queryFn: async () => {
      const idToken = await currentIdToken();
      return idToken ? listDocuments(idToken) : [];
    },
  });

  function byKind(kind: string) {
    return query.data?.find((document) => document.kind === kind) ?? null;
  }

  return { byKind, isLoading: query.isLoading };
}
