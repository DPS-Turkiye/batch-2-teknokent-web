"use client";

import { DocumentPreviewDialog } from "@/components/common/document-preview-dialog";
import { useDocumentPreviewStore } from "@/stores/document-preview-store";

/** Rendered once in the root layout, so any page can open a file preview through useShowDocumentPreview. */
export function DocumentPreviewHost() {
  const file = useDocumentPreviewStore((state) => state.file);
  const { close } = useDocumentPreviewStore((state) => state.actions);
  if (!file) return null;
  return <DocumentPreviewDialog file={file} onClose={close} />;
}
