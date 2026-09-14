"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useToast } from "@/components/providers/toast-provider";
import {
  getDocumentDownloadUrl,
  getStartupDocuments,
} from "@/lib/client/startup-documents";

export const STARTUP_DOCUMENTS_QUERY_KEY = ["startup-documents"] as const;

// The backend signs links for 30 minutes; reuse one well inside that window.
const DOCUMENT_URL_STALE_MS = 20 * 60_000;

export function documentUrlQueryKey(documentId: string) {
  return ["document-url", documentId] as const;
}

export function useStartupDocuments() {
  return useQuery({
    queryKey: STARTUP_DOCUMENTS_QUERY_KEY,
    queryFn: getStartupDocuments,
  });
}

/** A signed link for showing a file inline, such as the startup logo. */
export function useDocumentUrl(documentId: string | undefined) {
  return useQuery({
    queryKey: documentUrlQueryKey(documentId ?? ""),
    queryFn: () => getDocumentDownloadUrl(documentId as string),
    enabled: Boolean(documentId),
    staleTime: DOCUMENT_URL_STALE_MS,
  });
}

export function useOpenDocument() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useCallback(
    async (documentId: string) => {
      // Opened inside the click so pop-up blockers allow it, then pointed at
      // the file once the link is signed.
      const tab = window.open("", "_blank");
      if (tab) tab.opener = null;
      try {
        const link = await queryClient.fetchQuery({
          queryKey: documentUrlQueryKey(documentId),
          queryFn: () => getDocumentDownloadUrl(documentId),
          staleTime: DOCUMENT_URL_STALE_MS,
        });
        if (tab) tab.location.href = link.url;
        else window.location.assign(link.url);
      } catch {
        tab?.close();
        showToast({ message: "Dosya açılamadı.", tone: "error" });
      }
    },
    [queryClient, showToast],
  );
}
