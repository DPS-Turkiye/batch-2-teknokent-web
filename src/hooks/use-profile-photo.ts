"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/providers/toast-provider";
import { useDocumentUrl } from "@/hooks/use-startup-documents";
import { DocumentKind } from "@/interfaces/startup-document";
import { listOwnDocuments, uploadDocument } from "@/lib/client/documents";
import { currentAvatar, profilePhotoError } from "@/lib/personal-profile";

export const OWN_DOCUMENTS_QUERY_KEY = ["own-documents"] as const;

/** The signed-in person's profile photo, and a way to replace it. */
export function useProfilePhoto() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const documentsQuery = useQuery({
    queryKey: OWN_DOCUMENTS_QUERY_KEY,
    queryFn: listOwnDocuments,
  });
  const avatar = currentAvatar(documentsQuery.data ?? []);
  const urlQuery = useDocumentUrl(avatar?.id);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadDocument(file, DocumentKind.Avatar),
    onSuccess: () => {
      showToast({ message: "Profil fotoğrafın güncellendi.", tone: "success" });
      return queryClient.invalidateQueries({
        queryKey: OWN_DOCUMENTS_QUERY_KEY,
      });
    },
    onError: () =>
      showToast({ message: "Fotoğraf yüklenemedi.", tone: "error" }),
  });

  const upload = (file: File) => {
    const problem = profilePhotoError(file);
    if (problem) {
      showToast({ message: problem, tone: "error" });
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
