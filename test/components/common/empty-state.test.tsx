import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "@/components/common/empty-state";

describe("EmptyState", () => {
  it("shows the title, and the line and action only when given", () => {
    const { rerender } = render(<EmptyState title="Henüz randevun yok" />);
    expect(
      screen.getByRole("heading", { name: "Henüz randevun yok" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();

    rerender(
      <EmptyState
        title="Henüz randevun yok"
        body="Bir mentor seçip talep gönderebilirsin."
        action={<button type="button">Mentor bul</button>}
      />,
    );
    expect(
      screen.getByText("Bir mentor seçip talep gönderebilirsin."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mentor bul" }),
    ).toBeInTheDocument();
  });
});
