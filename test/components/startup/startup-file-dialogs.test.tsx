import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  DeleteDocumentDialog,
  FileUploadDialog,
  ShareDocumentDialog,
} from "@/components/startup/startup-file-dialogs";
import type { useFileUploadForm } from "@/hooks/use-file-upload-form";
import { DocumentKind } from "@/interfaces/startup-document";
import { documentFixture } from "@test/fixtures/startup-files";

const deck = documentFixture("deck", {
  shares: [
    {
      mentorId: "m-1",
      mentorName: "Nihan Öztürk",
      sharedAt: "2026-09-05T09:00:00Z",
    },
  ],
});

function uploadForm(
  overrides: Partial<ReturnType<typeof useFileUploadForm>> = {},
) {
  return {
    canSubmit: false,
    close: vi.fn(),
    file: null,
    isOpen: true,
    isUploading: false,
    kind: DocumentKind.PitchDeck,
    open: vi.fn(),
    setFile: vi.fn(),
    setKind: vi.fn(),
    submit: vi.fn(),
    ...overrides,
  };
}

describe("FileUploadDialog", () => {
  it("renders nothing while closed", () => {
    const { container } = render(
      <FileUploadDialog form={uploadForm({ isOpen: false })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("passes the chosen kind and file to the form", async () => {
    const user = userEvent.setup();
    const form = uploadForm();
    render(<FileUploadDialog form={form} />);

    expect(screen.getByRole("button", { name: "Yükle" })).toBeDisabled();
    await user.selectOptions(screen.getByLabelText("Dosya türü"), "Diğer");
    await user.upload(screen.getByLabelText("Dosya"), new File(["x"], "a.pdf"));

    expect(form.setKind).toHaveBeenCalledWith(DocumentKind.Other);
    expect(form.setFile).toHaveBeenCalledWith(expect.any(File));
  });
});

describe("ShareDocumentDialog", () => {
  it("offers to share with new mentors and unshare with existing ones", async () => {
    const user = userEvent.setup();
    const onShare = vi.fn();
    const onStopSharing = vi.fn();
    render(
      <ShareDocumentDialog
        document={deck}
        isBusy={false}
        mentors={[
          { id: "m-1", name: "Nihan Öztürk" },
          { id: "m-2", name: "Ahmet Yılmaz" },
        ]}
        onClose={vi.fn()}
        onShare={onShare}
        onStopSharing={onStopSharing}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Paylaşımı kaldır" }));
    await user.click(screen.getByRole("button", { name: "Paylaş" }));

    expect(onStopSharing).toHaveBeenCalledWith("m-1");
    expect(onShare).toHaveBeenCalledWith("m-2");
  });

  it("explains when there is no mentor to share with", () => {
    render(
      <ShareDocumentDialog
        document={deck}
        isBusy={false}
        mentors={[]}
        onClose={vi.fn()}
        onShare={vi.fn()}
        onStopSharing={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/paylaşabileceğin bir mentor yok/),
    ).toBeInTheDocument();
  });
});

describe("DeleteDocumentDialog", () => {
  it("names the file and confirms", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <DeleteDocumentDialog
        document={deck}
        isDeleting={false}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(
      screen.getByText(/deck\.pdf kalıcı olarak silinir/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sil" }));
    expect(onConfirm).toHaveBeenCalled();
  });
});
