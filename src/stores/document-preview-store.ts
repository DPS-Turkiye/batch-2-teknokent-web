import { create } from "zustand";

import type { DocumentDownload } from "@/interfaces/startup-document";

type DocumentPreviewStore = {
  file: DocumentDownload | null;
  // Never replaced, so the selected function stays the same reference across renders.
  actions: {
    show: (file: DocumentDownload) => void;
    close: () => void;
  };
};

export const useDocumentPreviewStore = create<DocumentPreviewStore>()(
  (set) => ({
    file: null,
    actions: {
      show: (file) => set({ file }),
      close: () => set({ file: null }),
    },
  }),
);

export function useShowDocumentPreview() {
  return useDocumentPreviewStore((state) => state.actions.show);
}
