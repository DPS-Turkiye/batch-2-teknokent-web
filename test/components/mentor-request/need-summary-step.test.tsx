import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NeedSummaryStep } from "@/components/mentor-request/need-summary-step";

describe("NeedSummaryStep", () => {
  it("renders the Figma Özet copy and selected need", () => {
    render(
      <NeedSummaryStep
        startupLine="Team TNT · Fikir · SaaS"
        needTitle="Ürün"
        problem="Kullanıcıların önemli bir kısmı ilk adımlarda bırakıyor."
        outcome="Bir sonraki adımları belirlemek"
        expertise={["Onboarding", "UX Strategy"]}
        onEditNeed={vi.fn()}
        onEditProblem={vi.fn()}
        onEditOutcome={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Seni doğru anladık mı?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Mentor eşleşmesini bu özete göre yapacağız/),
    ).toBeInTheDocument();
    expect(screen.getByText("Team TNT · Fikir · SaaS")).toBeInTheDocument();
    expect(
      screen.getByText("Profilinden otomatik getirildi"),
    ).toBeInTheDocument();
    expect(screen.getByText("İhtiyacın")).toBeInTheDocument();
    expect(screen.getByText("Ürün")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Kullanıcıların önemli bir kısmı ilk adımlarda bırakıyor.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Bir sonraki adımları belirlemek"),
    ).toBeInTheDocument();
    expect(screen.getByText("Onboarding")).toBeInTheDocument();
    expect(screen.getByText("UX Strategy")).toBeInTheDocument();
  });

  it("lets the mentee jump back to Konu, Durum, or Hedef", async () => {
    const onEditNeed = vi.fn();
    const onEditProblem = vi.fn();
    const onEditOutcome = vi.fn();
    const user = userEvent.setup();
    render(
      <NeedSummaryStep
        startupLine="Team TNT"
        needTitle="Ürün"
        problem="Onboarding kaybı"
        outcome="Karar"
        expertise={[]}
        onEditNeed={onEditNeed}
        onEditProblem={onEditProblem}
        onEditOutcome={onEditOutcome}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "İhtiyacını düzenle" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Temel problemi düzenle" }),
    );
    await user.click(screen.getByRole("button", { name: "Hedefi düzenle" }));

    expect(onEditNeed).toHaveBeenCalledOnce();
    expect(onEditProblem).toHaveBeenCalledOnce();
    expect(onEditOutcome).toHaveBeenCalledOnce();
  });
});
