"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

import { ToastTone } from "@/interfaces/toast";
import {
  getDocumentDownloadUrl,
  getStartupDocuments,
} from "@/lib/client/startup-documents";
import { useShowDocumentPreview } from "@/stores/document-preview-store";
import { useToast } from "@/stores/toast-store";

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
    queryFn: () => getDocumentDownloadUrl(documentId!),
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
        const link = await queryClient.query({
          queryKey: documentUrlQueryKey(documentId),
          queryFn: () => getDocumentDownloadUrl(documentId),
          staleTime: DOCUMENT_URL_STALE_MS,
        });
        showPreview({ ...link, id: documentId });
      } catch {
        showToast({ message: t("openFailed"), tone: ToastTone.Error });
      }
    },
    [queryClient, showPreview, showToast, t],
  );
}
