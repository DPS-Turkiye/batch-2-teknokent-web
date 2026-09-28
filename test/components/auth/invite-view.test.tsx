import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InviteView } from "@/components/auth/invite-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ login: vi.fn() }),
}));

describe("Invite form credential semantics", () => {
  it("uses a standard form and new-password autocomplete fields", () => {
    render(<InviteView />);

    expect(screen.getByLabelText(/E-posta/)).toHaveAttribute("name", "email");
    expect(screen.getByLabelText("Şifre *")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(screen.getByLabelText(/Şifre tekrar/)).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(screen.getByRole("button", { name: "Ekibe katıl" })).toHaveAttribute(
      "type",
      "submit",
    );
    expect(document.querySelector("form")).not.toBeNull();
  });
});
