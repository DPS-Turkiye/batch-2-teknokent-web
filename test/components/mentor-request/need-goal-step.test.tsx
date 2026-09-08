import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NeedGoalStep } from "@/components/mentor-request/need-goal-step";

describe("NeedGoalStep", () => {
  it("renders the Figma Hedef step copy and chips", () => {
    render(
      <NeedGoalStep
        goalIds={["next-steps"]}
        goalNote=""
        onToggleGoal={vi.fn()}
        onGoalNoteChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Bu görüşmenin sonunda neyin netleşmesini istersin?",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Bir veya iki sonuç seç/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Bir sonraki adımları belirlemek" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Bir karar vermek" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByPlaceholderText(/onboarding/i)).toBeInTheDocument();
  });

  it("toggles a goal chip", async () => {
    const onToggleGoal = vi.fn();
    const user = userEvent.setup();
    render(
      <NeedGoalStep
        goalIds={["next-steps"]}
        goalNote=""
        onToggleGoal={onToggleGoal}
        onGoalNoteChange={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Yol haritası oluşturmak" }),
    );
    expect(onToggleGoal).toHaveBeenCalledWith("roadmap");
  });
});
