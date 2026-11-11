import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DocumentPreviewHost } from "@/components/common/document-preview-host";
import { useDocumentPreviewStore } from "@/stores/document-preview-store";

vi.mock("@/components/common/document-preview-dialog", () => ({
  DocumentPreviewDialog: ({
    file,
    onClose,
  }: {
    file: { filename: string };
    onClose: () => void;
  }) => (
    <button type="button" onClick={onClose}>
      {file.filename}
    </button>
  ),
}));

describe("DocumentPreviewHost", () => {
  it("opens the file any component asked for and closes it again", () => {
    render(<DocumentPreviewHost />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    act(() =>
      useDocumentPreviewStore.getState().actions.show({
        id: "doc-1",
        url: "https://bucket.s3/min.pdf?sig",
        filename: "min.pdf",
        contentType: "application/pdf",
      }),
    );
    act(() => screen.getByRole("button", { name: "min.pdf" }).click());

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
