import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SubmitEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditableChips } from "@/components/common/editable-chips";

const onChange = vi.fn();

function renderChips(values: string[] = []) {
  render(
    <EditableChips
      label="Uzmanlık alanları"
      values={values}
      onChange={onChange}
    />,
  );
}

beforeEach(() => onChange.mockReset());

describe("EditableChips", () => {
  it("explains how to fill an empty set instead of showing nothing", () => {
    renderChips();

    expect(screen.getByText(/Henüz bir alan eklenmedi/)).toBeInTheDocument();
  });

  it("adds a typed value", async () => {
    const user = userEvent.setup();
    renderChips(["Ürün"]);

    await user.type(
      screen.getByLabelText("Uzmanlık alanları ekle"),
      "Analitik",
    );
    await user.click(screen.getByRole("button", { name: /Ekle/ }));

    expect(onChange).toHaveBeenCalledWith(["Ürün", "Analitik"]);
  });

  it("adds on Enter without submitting the surrounding form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: SubmitEvent) => {
      event.preventDefault();
    });
    render(
      <form onSubmit={onSubmit}>
        <EditableChips
          label="Uzmanlık alanları"
          values={[]}
          onChange={onChange}
        />
      </form>,
    );

    await user.type(
      screen.getByLabelText("Uzmanlık alanları ekle"),
      "Analitik{Enter}",
    );

    expect(onChange).toHaveBeenCalledWith(["Analitik"]);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("removes a chip", async () => {
    const user = userEvent.setup();
    renderChips(["Ürün", "Analitik"]);

    await user.click(
      screen.getByRole("button", { name: "Ürün alanını kaldır" }),
    );

    expect(onChange).toHaveBeenCalledWith(["Analitik"]);
  });

  it("ignores a duplicate", async () => {
    const user = userEvent.setup();
    renderChips(["Ürün"]);

    await user.type(screen.getByLabelText("Uzmanlık alanları ekle"), "Ürün");
    await user.click(screen.getByRole("button", { name: /Ekle/ }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("ignores whitespace-only input", async () => {
    const user = userEvent.setup();
    renderChips();

    await user.type(screen.getByLabelText("Uzmanlık alanları ekle"), "   ");

    expect(screen.getByRole("button", { name: /Ekle/ })).toBeDisabled();
  });
});
