"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { DocumentPreviewDialog } from "@/components/common/document-preview-dialog";
import type { DocumentDownload } from "@/interfaces/startup-document";

type ShowPreview = (file: DocumentDownload) => void;

const DocumentPreviewContext = createContext<ShowPreview | null>(null);

export function DocumentPreviewProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<DocumentDownload | null>(null);
  const showPreview = useCallback<ShowPreview>((next) => setFile(next), []);
  const value = useMemo(() => showPreview, [showPreview]);

  return (
    <DocumentPreviewContext.Provider value={value}>
      {children}
      {file ? (
        <DocumentPreviewDialog file={file} onClose={() => setFile(null)} />
      ) : null}
    </DocumentPreviewContext.Provider>
  );
}

export function useShowDocumentPreview() {
  return useContext(DocumentPreviewContext);
}
