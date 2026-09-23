import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StartupInviteCode } from "@/components/startup/startup-invite-code";
import { useInviteCodeCard } from "@/hooks/use-organization-invite";

vi.mock("@/hooks/use-organization-invite", () => ({
  useInviteCodeCard: vi.fn(),
}));

type Card = ReturnType<typeof useInviteCodeCard>;

const copy = vi.fn();
const rotate = vi.fn();

function card(overrides: Partial<Card> = {}): Card {
  return {
    code: "ABCD2345",
    copied: false,
    copy,
    error: null,
    isLoading: false,
    isRotating: false,
    rotate,
    ...overrides,
  };
}

describe("StartupInviteCode", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the code and explains where a teammate redeems it", () => {
    vi.mocked(useInviteCodeCard).mockReturnValue(card());
    render(<StartupInviteCode />);

    expect(screen.getByText("ABCD2345")).toBeInTheDocument();
    expect(
      screen.getByText(/\/invite sayfasında bu kodla kayıt olur/),
    ).toBeInTheDocument();
  });

  it("copies the code and then says so", async () => {
    const user = userEvent.setup();
    vi.mocked(useInviteCodeCard).mockReturnValue(card());
    const { rerender } = render(<StartupInviteCode />);

    await user.click(screen.getByRole("button", { name: "Kopyala" }));
    expect(copy).toHaveBeenCalledOnce();

    vi.mocked(useInviteCodeCard).mockReturnValue(card({ copied: true }));
    rerender(<StartupInviteCode />);
    expect(screen.getByRole("button", { name: "Kopyalandı" })).toBeEnabled();
  });

  it("regenerates the code and blocks a second press while it runs", async () => {
    const user = userEvent.setup();
    vi.mocked(useInviteCodeCard).mockReturnValue(card());
    const { rerender } = render(<StartupInviteCode />);

    await user.click(screen.getByRole("button", { name: "Yeni kod üret" }));
    expect(rotate).toHaveBeenCalledOnce();

    vi.mocked(useInviteCodeCard).mockReturnValue(card({ isRotating: true }));
    rerender(<StartupInviteCode />);
    expect(screen.getByRole("button", { name: "Üretiliyor…" })).toBeDisabled();
  });

  it("reports a failure to load instead of showing an empty code", () => {
    vi.mocked(useInviteCodeCard).mockReturnValue(
      card({ code: null, error: new Error("Davet kodu alınamadı.") }),
    );
    render(<StartupInviteCode />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Davet kodu alınamadı.",
    );
    expect(
      screen.queryByRole("button", { name: "Kopyala" }),
    ).not.toBeInTheDocument();
  });

  it("shows a loading state while the code is being fetched", () => {
    vi.mocked(useInviteCodeCard).mockReturnValue(
      card({ code: null, isLoading: true }),
    );
    render(<StartupInviteCode />);

    expect(screen.getByText("Davet kodu yükleniyor…")).toBeInTheDocument();
  });
});
