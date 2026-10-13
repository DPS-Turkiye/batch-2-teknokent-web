"use client";

import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/providers/toast-provider";
import { useDocumentUrl } from "@/hooks/use-startup-documents";
import { DocumentKind } from "@/interfaces/startup-document";
import { listOwnDocuments, uploadDocument } from "@/lib/client/documents";
import { currentAvatar, profilePhotoError } from "@/lib/personal-profile";

export const OWN_DOCUMENTS_QUERY_KEY = ["own-documents"] as const;

// Every page's top bar asks for the photo; it only changes through this hook,
// which refetches after an upload, so a page change needn't ask again.
const OWN_DOCUMENTS_STALE_MS = 5 * 60_000;

/** The signed-in person's profile photo, and a way to replace it. */
export function useProfilePhoto() {
  const t = useTranslations("personalProfile");
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const documentsQuery = useQuery({
    queryKey: OWN_DOCUMENTS_QUERY_KEY,
    queryFn: listOwnDocuments,
    staleTime: OWN_DOCUMENTS_STALE_MS,
  });
  const avatar = currentAvatar(documentsQuery.data ?? []);
  const urlQuery = useDocumentUrl(avatar?.id);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadDocument(file, DocumentKind.Avatar),
    onSuccess: () => {
      showToast({ message: t("photoUpdated"), tone: "success" });
      return queryClient.invalidateQueries({
        queryKey: OWN_DOCUMENTS_QUERY_KEY,
      });
    },
    onError: () => showToast({ message: t("photoFailed"), tone: "error" }),
  });

  const upload = (file: File) => {
    const problem = profilePhotoError(file);
    if (problem) {
      showToast({ message: t(problem), tone: "error" });
      return;
    }
    uploadMutation.mutate(file);
  };

  return {
    photoUrl: urlQuery.data?.url ?? null,
    isUploading: uploadMutation.isPending,
    upload,
  };
}
