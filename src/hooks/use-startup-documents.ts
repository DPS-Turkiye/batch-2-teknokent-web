"use client";

import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useShowDocumentPreview } from "@/components/providers/document-preview-provider";
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
  const t = useTranslations("startupFiles.toasts");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const showPreview = useShowDocumentPreview();

  return useCallback(
    async (documentId: string) => {
      try {
        const link = await queryClient.fetchQuery({
          queryKey: documentUrlQueryKey(documentId),
          queryFn: () => getDocumentDownloadUrl(documentId),
          staleTime: DOCUMENT_URL_STALE_MS,
        });
        if (showPreview) {
          showPreview({ ...link, id: documentId });
          return;
        }
        showToast({ message: t("openFailed"), tone: "error" });
      } catch {
        showToast({ message: t("openFailed"), tone: "error" });
      }
    },
    [queryClient, showPreview, showToast, t],
  );
}
