import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentPreviewDialog } from "@/components/common/document-preview-dialog";

const blobUrl = "blob:http://localhost/preview";

describe("DocumentPreviewDialog", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: () =>
          Promise.resolve(new Blob(["%PDF-1.4"], { type: "application/pdf" })),
      }),
    );
    vi.spyOn(URL, "createObjectURL").mockReturnValue(blobUrl);
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("loads a PDF through the same-origin content route so the iframe is not blocked", async () => {
    render(
      <DocumentPreviewDialog
        file={{
          id: "doc-1",
          url: "https://bucket.s3/min.pdf?sig",
          filename: "min.pdf",
          contentType: "application/pdf",
        }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Dosya yükleniyor…")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/startup/documents/doc-1/content");

    await waitFor(() => {
      expect(screen.getByTitle("min.pdf")).toHaveAttribute(
        "src",
        `${blobUrl}#toolbar=0&navpanes=0`,
      );
    });
  });

  it("shows an error when the file cannot be read", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);

    render(
      <DocumentPreviewDialog
        file={{
          id: "doc-1",
          url: "https://bucket.s3/min.pdf?sig",
          filename: "min.pdf",
          contentType: "application/pdf",
        }}
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Dosya önizlenemedi.",
    );
  });
});
