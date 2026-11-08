"use client";

import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useToast } from "@/stores/toast-store";
import { STARTUP_DOCUMENTS_QUERY_KEY } from "@/hooks/use-startup-documents";
import { DocumentKind } from "@/interfaces/startup-document";
import { uploadDocument } from "@/lib/client/documents";

/** The "Dosya Yükle" dialog: which kind of file, which file, and the upload. */
export function useFileUploadForm() {
  const t = useTranslations("startupFiles.toasts");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [kind, setKind] = useState(DocumentKind.PitchDeck);
  const [file, setFile] = useState<File | null>(null);

  const upload = useMutation({
    mutationFn: (variables: { file: File; kind: DocumentKind }) =>
      uploadDocument(variables.file, variables.kind),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: STARTUP_DOCUMENTS_QUERY_KEY,
      });
      setIsOpen(false);
      showToast({ message: t("uploaded"), tone: "success" });
    },
    onError: (error) =>
      showToast({
        message: error instanceof Error ? error.message : t("uploadFailed"),
        tone: "error",
      }),
  });

  return {
    canSubmit: Boolean(file) && !upload.isPending,
    close: () => setIsOpen(false),
    file,
    isOpen,
    isUploading: upload.isPending,
    kind,
    open: () => {
      setKind(DocumentKind.PitchDeck);
      setFile(null);
      upload.reset();
      setIsOpen(true);
    },
    setFile,
    setKind,
    submit: () => {
      if (file) upload.mutate({ file, kind });
    },
  };
}
