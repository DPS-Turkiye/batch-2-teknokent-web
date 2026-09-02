import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramSelect } from "@/components/common/program-select";

const OPTIONS = [
  { id: "prog-1", name: "metustarts 2026", hint: "Demo Koordinatör" },
  { id: "prog-2", name: "Seed 2026" },
];

const NO_PROGRAM = "Bir programa dahil değilim";

function renderSelect(overrides: Record<string, unknown> = {}) {
  const onChange = vi.fn();
  render(
    <ProgramSelect
      label="Program"
      options={OPTIONS}
      value={null}
      onChange={onChange}
      noProgramLabel={NO_PROGRAM}
      {...overrides}
    />,
  );
  return { onChange };
}

beforeEach(() => vi.clearAllMocks());

describe("ProgramSelect", () => {
  it("keeps the options hidden until opened", async () => {
    const user = userEvent.setup();
    renderSelect();

    expect(screen.getByRole("listbox", { hidden: true })).not.toBeVisible();
    await user.click(
      screen.getByRole("button", { name: new RegExp(NO_PROGRAM) }),
    );
    expect(screen.getByRole("listbox")).toBeVisible();
  });

  it("offers every program plus an explicit no-program option", async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(
      screen.getByRole("button", { name: new RegExp(NO_PROGRAM) }),
    );
    const options = within(screen.getByRole("listbox")).getAllByRole("option");

    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent(NO_PROGRAM);
    expect(options[1]).toHaveTextContent("metustarts 2026");
    expect(options[2]).toHaveTextContent("Seed 2026");
  });

  it("shows the hint under a program that has one", async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(
      screen.getByRole("button", { name: new RegExp(NO_PROGRAM) }),
    );

    expect(
      screen.getByRole("option", { name: /metustarts 2026/ }),
    ).toHaveTextContent("Demo Koordinatör");
  });

  it("reports the chosen program", async () => {
    const user = userEvent.setup();
    const { onChange } = renderSelect();

    await user.click(
      screen.getByRole("button", { name: new RegExp(NO_PROGRAM) }),
    );
    await user.click(screen.getByRole("option", { name: /Seed 2026/ }));

    expect(onChange).toHaveBeenCalledWith("prog-2");
  });

  it("reports null when no-program is chosen", async () => {
    const user = userEvent.setup();
    const { onChange } = renderSelect({ value: "prog-1" });

    await user.click(screen.getByRole("button", { name: /metustarts 2026/ }));
    await user.click(
      screen.getByRole("option", { name: new RegExp(NO_PROGRAM) }),
    );

    expect(onChange).toHaveBeenCalledWith(null);
  });

  // Re-picking the current value would be a pointless write for callers that
  // persist on change.
  it("stays quiet when the current value is picked again", async () => {
    const user = userEvent.setup();
    const { onChange } = renderSelect({ value: "prog-1" });

    await user.click(screen.getByRole("button", { name: /metustarts 2026/ }));
    await user.click(screen.getByRole("option", { name: /metustarts 2026/ }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("marks the current value as the selected option", async () => {
    const user = userEvent.setup();
    renderSelect({ value: "prog-2" });

    await user.click(screen.getByRole("button", { name: /Seed 2026/ }));

    expect(screen.getByRole("option", { name: /Seed 2026/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("option", { name: /metustarts 2026/ }),
    ).toHaveAttribute("aria-selected", "false");
  });

  it("cannot be opened while disabled", async () => {
    const user = userEvent.setup();
    renderSelect({ disabled: true });

    await user.click(
      screen.getByRole("button", { name: new RegExp(NO_PROGRAM) }),
    );

    expect(screen.getByRole("listbox", { hidden: true })).not.toBeVisible();
  });
});
