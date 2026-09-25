import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MobileToggle } from "@/components/mobile/mobile-toggle";

describe("MobileToggle", () => {
  it("is a labelled switch that reports clicks", async () => {
    const onChange = vi.fn();
    render(<MobileToggle label="Mesajlar" checked onChange={onChange} />);

    const toggle = screen.getByRole("switch", { name: "Mesajlar" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    await userEvent.click(toggle);

    expect(onChange).toHaveBeenCalled();
  });
});
