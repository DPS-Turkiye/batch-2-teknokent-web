"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { type CvParseResult, useCvParse } from "@/hooks/use-cv-parse";
import {
  STORED_DOCUMENTS_QUERY_KEY,
  useStoredDocuments,
} from "@/hooks/use-stored-documents";
import type { UploadedFile } from "@/interfaces/signup";
import { DocumentKind } from "@/interfaces/startup-document";
import type { UserProfileInput } from "@/interfaces/user-profile";
import { uploadDocument } from "@/lib/client/documents";
import { applyCvParse } from "@/lib/cv-suggestions";

const PROFILE_BIO_MAX_LENGTH = 5000;

type SetField = <K extends keyof UserProfileInput>(
  field: K,
  value: UserProfileInput[K],
) => void;

/**
 * The CV section of the personal profile's edit mode. A chosen file is stored
 * straight away, like at signup; what is read from it only lands in the draft,
 * so nothing on the profile changes until Kaydet.
 */
export function usePersonalCv(
  draft: UserProfileInput | null,
  setField: SetField,
) {
  const queryClient = useQueryClient();
  const storedCv = useStoredDocuments().byKind(DocumentKind.Cv);
  const [selected, setSelected] = useState<UploadedFile | null>(null);
  const [filled, setFilled] = useState(false);
  const parse = useCvParse();
  const upload = useMutation({
    mutationFn: (file: File) => uploadDocument(file, DocumentKind.Cv),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: STORED_DOCUMENTS_QUERY_KEY }),
  });

  function fill(parsed: CvParseResult) {
    if (!draft) return;
    const next = applyCvParse(
      {
        role: draft.jobTitle ?? "",
        bio: draft.bio ?? "",
        expertise: draft.expertise,
      },
      parsed,
      { keepFilled: false, bioMaxLength: PROFILE_BIO_MAX_LENGTH },
    );
    setField("jobTitle", next.role);
    setField("bio", next.bio);
    setField("expertise", next.expertise);
    setFilled(true);
  }

  function choose(file: UploadedFile | null) {
    setSelected(file);
    setFilled(false);
    const raw = file?.file;
    if (!raw) return;
    upload.mutate(raw, {
      onSuccess: () => parse.mutate(raw, { onSuccess: fill }),
    });
  }

  function fillFromStored() {
    if (!storedCv) return;
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
    canFill: storedIsPdf && !isBusy,
    fillFromStored,
    isUploading: upload.isPending,
    isParsing: parse.isPending,
    error: upload.error?.message ?? parse.error?.message ?? null,
    filled: filled && !isBusy,
    expertise: draft?.expertise ?? [],
    setExpertise: (values: string[]) => setField("expertise", values),
  };
}
