import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NumberStepper } from "@/components/common/number-stepper";
import { ToggleSwitch } from "@/components/common/toggle-switch";

describe("NumberStepper", () => {
  it("steps and types through its callbacks", async () => {
    const user = userEvent.setup();
    const onStep = vi.fn();
    const onChange = vi.fn();
    render(
      <NumberStepper
        label="Varsayılan görüşme süresi"
        value="45"
        min={15}
        max={480}
        unit="dk"
        onStep={onStep}
        onChange={onChange}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Varsayılan görüşme süresi artır" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Varsayılan görüşme süresi azalt" }),
    );
    await user.type(
      screen.getByRole("spinbutton", { name: "Varsayılan görüşme süresi" }),
      "0",
    );

    expect(onStep).toHaveBeenNthCalledWith(1, 1);
    expect(onStep).toHaveBeenNthCalledWith(2, -1);
    expect(onChange).toHaveBeenCalledWith("450");
    expect(screen.getByText("dk")).toBeInTheDocument();
  });

  it("disables the step that would leave the bounds", () => {
    render(
      <NumberStepper
        label="Tampon"
        value="0"
        min={0}
        max={240}
        onStep={vi.fn()}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Tampon azalt" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Tampon artır" })).toBeEnabled();
  });
});

describe("ToggleSwitch", () => {
  it("reports its state and toggles on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ToggleSwitch checked label="Salı uygun" onChange={onChange} />);

    const toggle = screen.getByRole("switch", { name: "Salı uygun" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    await user.click(toggle);

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
