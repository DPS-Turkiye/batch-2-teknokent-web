"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useAiFeatures } from "@/hooks/use-ai-features";
import {
  STORED_DOCUMENTS_QUERY_KEY,
  useStoredDocuments,
} from "@/hooks/use-stored-documents";
import type { UploadedFile } from "@/interfaces/signup";
import { DocumentKind } from "@/interfaces/startup-document";
import { uploadDocument } from "@/lib/client/documents";
import type { CvSource } from "@/lib/client/profile-analysis";

/**
 * A profile's CV in edit mode: the one on file, replacing it, and reading it.
 * A chosen file is stored straight away; what is read goes to `onRead`, which
 * only fills the form, so the profile changes on Kaydet. Where profile parsing
 * is switched off the file is only stored and the form is filled by hand.
 */
export function useCvFile<T>({
  read,
  onRead,
}: {
  read: (source: CvSource) => Promise<T>;
  onRead: (result: T) => void;
}) {
  const queryClient = useQueryClient();
  const canRead = useAiFeatures().profileParsing;
  const storedCv = useStoredDocuments().byKind(DocumentKind.Cv);
  const [selected, setSelected] = useState<UploadedFile | null>(null);
  const [filled, setFilled] = useState(false);
  const parse = useMutation({ mutationFn: read });
  const upload = useMutation({
    mutationFn: (file: File) => uploadDocument(file, DocumentKind.Cv),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: STORED_DOCUMENTS_QUERY_KEY }),
  });

  function fill(result: T) {
    onRead(result);
    setFilled(true);
  }

  function choose(file: UploadedFile | null) {
    setSelected(file);
    setFilled(false);
    const raw = file?.file;
    if (!raw) return;
    upload.mutate(raw, {
      onSuccess: () => {
        if (canRead) parse.mutate(raw, { onSuccess: fill });
      },
    });
  }

  function fillFromStored() {
    if (!storedCv || !canRead) return;
    setFilled(false);
    parse.mutate({ documentId: storedCv.id }, { onSuccess: fill });
  }

  const isBusy = upload.isPending || parse.isPending;
  // Signup also took DOCX, but only a PDF can be read into the profile.
  const storedIsPdf = Boolean(
    storedCv?.originalFilename.toLowerCase().endsWith(".pdf"),
  );

  return {
    selected,
    storedName: storedCv?.originalFilename ?? null,
    storedIsPdf,
    choose,
    canRead,
    canFill: canRead && storedIsPdf && !isBusy,
    fillFromStored,
    isUploading: upload.isPending,
    isParsing: parse.isPending,
    error: upload.error?.message ?? parse.error?.message ?? null,
    filled: filled && !isBusy,
  };
}

export type CvFileState = ReturnType<typeof useCvFile>;
