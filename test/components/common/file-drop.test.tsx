import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FileDrop } from "@/components/common/file-drop";
import { InLocale } from "@test/test-utils";

function drop(file: File) {
  fireEvent.drop(screen.getByText("Dosyayı sürükleyip bırakın"), {
    dataTransfer: { files: [file] },
  });
}

describe("FileDrop", () => {
  it("takes a file dropped on it", () => {
    const onChange = vi.fn();
    const file = new File(["cv"], "cv.pdf", { type: "application/pdf" });
    render(
      <FileDrop file={null} label="CV" helpText="PDF" onChange={onChange} />,
    );

    drop(file);

    expect(onChange).toHaveBeenCalledWith({
      name: "cv.pdf",
      size: file.size,
      file,
    });
  });

  it("refuses a dropped file over the limit", () => {
    const onChange = vi.fn();
    render(
      <FileDrop
        file={null}
        label="CV"
        helpText="PDF"
        onChange={onChange}
        maxBytes={1}
      />,
    );

    drop(new File(["too big"], "cv.pdf"));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("sınırını aşamaz");
  });

  it("reads in English", () => {
    render(
      <InLocale locale="en">
        <FileDrop
          file={null}
          label="CV"
          helpText="PDF"
          onChange={vi.fn()}
          maxBytes={1}
        />
      </InLocale>,
    );

    expect(screen.getByText("Drag and drop the file")).toBeInTheDocument();
    fireEvent.drop(screen.getByText("Drag and drop the file"), {
      dataTransfer: { files: [new File(["too big"], "cv.pdf")] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The file can't be larger than",
    );
  });
});
