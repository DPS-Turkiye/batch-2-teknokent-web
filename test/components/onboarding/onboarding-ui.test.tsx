import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  OnboardingFileField,
  OnboardingImagePicker,
} from "@/components/onboarding/onboarding-ui";
import type { UploadedFile } from "@/interfaces/signup";
import { DocumentKind } from "@/interfaces/startup-document";

const MB = 1024 * 1024;

// A person can switch the picker to "All files", so the field must check what it gets despite `accept`.
const user = () => userEvent.setup({ applyAccept: false });

function sized(file: File, size: number) {
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function renderMvpField() {
  const onChange = vi.fn<(file: UploadedFile | null) => void>();
  render(
    <OnboardingFileField
      label="MVP / Prototip dosyası seç"
      file={null}
      onChange={onChange}
      kind={DocumentKind.Mvp}
    />,
  );
  return onChange;
}

describe("OnboardingFileField", () => {
  it("shows the accepted formats and size, and filters the picker", () => {
    renderMvpField();

    expect(
      screen.getByText("PDF, DOCX veya PPTX · en fazla 25 MB"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("MVP / Prototip dosyası seç")).toHaveAttribute(
      "accept",
      expect.stringContaining(".pptx"),
    );
  });

  it("refuses an .avi video before anything is sent and points to the link field", async () => {
    const onChange = renderMvpField();

    await user().upload(
      screen.getByLabelText("MVP / Prototip dosyası seç"),
      new File(["video"], "mvp.avi", { type: "video/x-msvideo" }),
    );

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Video dosyası yüklenemiyor.",
    );
  });

  it("refuses a file over 25 MB with the limit", async () => {
    const onChange = renderMvpField();

    await user().upload(
      screen.getByLabelText("MVP / Prototip dosyası seç"),
      sized(
        new File(["deck"], "mvp.pdf", { type: "application/pdf" }),
        26 * MB,
      ),
    );

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Dosya çok büyük (en fazla 25 MB).",
    );
  });

  it("refuses a dropped file of the wrong type", () => {
    const onChange = vi.fn<(file: UploadedFile | null) => void>();
    render(
      <OnboardingFileField
        label="CV dosyası seç"
        file={null}
        onChange={onChange}
        kind={DocumentKind.Cv}
      />,
    );

    fireEvent.drop(screen.getByText("PDF veya DOCX · en fazla 25 MB"), {
      dataTransfer: {
        files: [new File(["x"], "cv.png", { type: "image/png" })],
      },
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Bu dosya türü desteklenmiyor. PDF veya DOCX yükleyin.",
    );
  });

  it("ties the refusal to the drop area for screen readers", async () => {
    renderMvpField();

    await user().upload(
      screen.getByLabelText("MVP / Prototip dosyası seç"),
      new File(["x"], "mvp.zip", { type: "application/zip" }),
    );

    expect(
      screen.getByRole("button", { name: /Dosyayı sürükleyip bırak/ }),
    ).toHaveAccessibleDescription(
      "Bu dosya türü desteklenmiyor. PDF, DOCX veya PPTX yükleyin.",
    );
  });

  it("drops a stale refusal when the chosen file is removed", async () => {
    const onChange = vi.fn<(file: UploadedFile | null) => void>();
    const props = {
      label: "CV dosyası seç",
      onChange,
      kind: DocumentKind.Cv,
    } as const;
    const { rerender } = render(<OnboardingFileField {...props} file={null} />);
    await user().upload(
      screen.getByLabelText("CV dosyası seç"),
      new File(["x"], "cv.avi", { type: "video/x-msvideo" }),
    );
    rerender(
      <OnboardingFileField {...props} file={{ name: "cv.pdf", size: 10 }} />,
    );

    await user().click(
      screen.getByRole("button", { name: "cv.pdf dosyasını kaldır" }),
    );

    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("takes an accepted file", async () => {
    const onChange = renderMvpField();
    const file = new File(["deck"], "mvp.pptx", {
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    });

    await user().upload(
      screen.getByLabelText("MVP / Prototip dosyası seç"),
      file,
    );

    expect(onChange).toHaveBeenCalledWith({
      name: "mvp.pptx",
      size: file.size,
      file,
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("OnboardingImagePicker", () => {
  function renderLogo() {
    const onChange = vi.fn<(file: UploadedFile | null) => void>();
    render(
      <OnboardingImagePicker
        label="Startup logosu"
        placeholder="Logo"
        file={null}
        onChange={onChange}
        kind={DocumentKind.Logo}
      />,
    );
    return onChange;
  }

  it("shows the image formats and size, and describes the picker with them", () => {
    renderLogo();

    expect(
      screen.getByRole("button", { name: "Startup logosu seç" }),
    ).toHaveAccessibleDescription("PNG, JPG veya WEBP · en fazla 5 MB");
  });

  it("refuses a GIF logo", async () => {
    const onChange = renderLogo();

    await user().upload(
      screen.getByLabelText("Startup logosu"),
      new File(["gif"], "logo.gif", { type: "image/gif" }),
    );

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Bu dosya türü desteklenmiyor. PNG, JPG veya WEBP yükleyin.",
    );
  });

  it("refuses a logo over 5 MB", async () => {
    const onChange = renderLogo();

    await user().upload(
      screen.getByLabelText("Startup logosu"),
      sized(new File(["png"], "logo.png", { type: "image/png" }), 6 * MB),
    );

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Dosya çok büyük (en fazla 5 MB).",
    );
  });

  it("takes a PNG logo", async () => {
    const onChange = renderLogo();
    const file = new File(["png"], "logo.png", { type: "image/png" });

    await user().upload(screen.getByLabelText("Startup logosu"), file);

    expect(onChange).toHaveBeenCalledWith({
      name: "logo.png",
      size: file.size,
      file,
    });
  });
});
