import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FileDrop } from "@/components/common/file-drop";

function drop(file: File) {
  fireEvent.drop(screen.getByText("Dosyayı sürükleyip bırakın"), {
    dataTransfer: { files: [file] },
  });
}

describe("FileDrop", () => {
  it("takes a file dropped on it", () => {
    const onChange = vi.fn();
    const file = new File(["cv"], "cv.pdf", { type: "application/pdf" });
    render(<FileDrop file={null} label="CV" onChange={onChange} />);

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
      <FileDrop file={null} label="CV" onChange={onChange} maxBytes={1} />,
    );

    drop(new File(["too big"], "cv.pdf"));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("sınırını aşamaz");
  });
});
