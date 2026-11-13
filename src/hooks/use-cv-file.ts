"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { useAiFeatureRefusal, useAiFeatures } from "@/hooks/use-ai-features";
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
 * is switched off, or the person has not ticked the reading consent (unticked by
 * default), the file is only stored and the form is filled by hand.
 */
export function useCvFile<T>({
  read,
  onRead,
}: {
  read: (source: CvSource, consentAccepted: boolean) => Promise<T>;
  onRead: (result: T) => void;
}) {
  const queryClient = useQueryClient();
  const canRead = useAiFeatures().profileParsing;
  const refused = useAiFeatureRefusal();
  const storedCv = useStoredDocuments().byKind(DocumentKind.Cv);
  const [selected, setSelected] = useState<UploadedFile | null>(null);
  const [filled, setFilled] = useState(false);
  const [consent, setConsentState] = useState(false);
  // The upload finishes after the click that chose the file, so whether to read
  // it is decided by the box as it is then, not as it was at the click.
  const consentRef = useRef(false);
  const parse = useMutation({
    mutationFn: ({
      source,
      consentAccepted,
    }: {
      source: CvSource;
      consentAccepted: boolean;
    }) => read(source, consentAccepted),
    onError: (error) => {
      refused(error);
    },
  });
  const upload = useMutation({
    mutationFn: (file: File) => uploadDocument(file, DocumentKind.Cv),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: STORED_DOCUMENTS_QUERY_KEY }),
  });

  function fill(result: T) {
    onRead(result);
    setFilled(true);
  }

  function setConsent(next: boolean) {
    consentRef.current = next;
    setConsentState(next);
  }

  function choose(file: UploadedFile | null) {
    setSelected(file);
    setFilled(false);
    const raw = file?.file;
    if (!raw) return;
    upload.mutate(raw, {
      onSuccess: () => {
        const consentAccepted = consentRef.current;
        if (canRead && consentAccepted)
          parse.mutate({ source: raw, consentAccepted }, { onSuccess: fill });
      },
    });
  }

  function fillFromStored() {
    if (!storedCv || !canRead || !consent) return;
    setFilled(false);
    parse.mutate(
      { source: { documentId: storedCv.id }, consentAccepted: consent },
      { onSuccess: fill },
    );
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
    consent,
    setConsent,
    canFill: canRead && consent && storedIsPdf && !isBusy,
    // A CV chosen before the consent was ticked is stored unread, so reading
    // it stays on offer until something has been filled in.
    offerFill: Boolean(storedCv) && !filled && !isBusy,
    fillFromStored,
    isUploading: upload.isPending,
    isParsing: parse.isPending,
    error: upload.error?.message ?? parse.error?.message ?? null,
    filled: filled && !isBusy,
  };
}

export type CvFileState = ReturnType<typeof useCvFile>;
