"use client";

import { useQuery } from "@tanstack/react-query";

import { listDocuments } from "@/lib/client/documents";
import { currentIdToken } from "@/lib/firebase/auth";

/**
 * What the wizard has already persisted for this Firebase user, keyed by
 * document kind. A brand-new signup has none yet; a resumed one (after a
 * reload dropped the in-memory File objects) may already have some.
 */
export function useStoredDocuments() {
  const query = useQuery({
    queryKey: ["signup-stored-documents"],
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
