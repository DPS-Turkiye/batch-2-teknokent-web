import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { needChoices } from "@/lib/mentor-request-need";

import { NeedSituationStep } from "@/components/mentor-request/need-situation-step";

const STARTUP_CHOICES = needChoices(false);

describe("NeedSituationStep", () => {
  it("renders the Figma Durum step copy and situations", () => {
    render(
      <NeedSituationStep
        situations={STARTUP_CHOICES.situations}
        situationId="onboarding"
        noneSummary=""
        onSelectSituation={vi.fn()}
        onNoneSummaryChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Hangisi yaşadığın duruma daha yakın?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Onboarding sırasında kullanıcı kaybediyoruz/,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /Bunlardan hiçbiri/ }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByPlaceholderText(/kendi cümlelerinle/i)).toBeNull();
  });

  it("selects a situation and shows the none field when needed", async () => {
    const onSelectSituation = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <NeedSituationStep
        situations={STARTUP_CHOICES.situations}
        situationId="onboarding"
        noneSummary=""
        onSelectSituation={onSelectSituation}
        onNoneSummaryChange={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /Konumlandırmamız net değil/ }),
    );
    expect(onSelectSituation).toHaveBeenCalledWith("positioning");

    rerender(
      <NeedSituationStep
        situations={STARTUP_CHOICES.situations}
        situationId="none"
        noneSummary=""
        onSelectSituation={onSelectSituation}
        onNoneSummaryChange={vi.fn()}
      />,
    );
    expect(
      screen.getByPlaceholderText(/kendi cümlelerinle/i),
    ).toBeInTheDocument();
  });
});
